import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth, twoFactorChannelStorage, TTwoFactorChannelContext } from "@/app/lib/auth";
import { getClientIp, isRateLimited } from "@/app/lib/rate-limit";
import { parseJsonBody, sendTwoFactorCodeBodySchema } from "@/app/lib/validation";

// The user isn't known to this route (there is no session yet, only the pending 2FA cookie), so
// it is limited per IP. The per-user limit lives in the sender itself (see app/lib/auth.ts).
const SEND_WINDOW_MS = 10 * 60 * 1000
const SEND_MAX_PER_IP = 20

type TPostSendCode = (request: NextRequest) => Promise<NextResponse>

// Sends the sign-in code to the chosen channel. Stands in for better-auth's /two-factor/send-otp,
// which is disabled because it can't pick between email and SMS.
export const POST: TPostSendCode = async (request) => {
	const parsed = await parseJsonBody(request, sendTwoFactorCodeBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "channel must be email or phone", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	if (
		isRateLimited(
			`2fa-send-ip:${getClientIp(request.headers)}`,
			SEND_MAX_PER_IP,
			SEND_WINDOW_MS,
		)
	) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	const context: TTwoFactorChannelContext = { channel: parsed.data.channel }

	try {
		await twoFactorChannelStorage.run(context, () =>
			auth.api.sendTwoFactorOTP({ body: {}, headers: request.headers }),
		)
	} catch (err) {
		if (err instanceof APIError) {
			return NextResponse.json(
				{ message: err.body?.message, code: err.body?.code },
				{ status: err.statusCode },
			)
		}
		return NextResponse.json(
			{ message: "failed to send code", code: "UNEXPECTED_ERROR" },
			{ status: 500 },
		)
	}

	if (context.failure) {
		return NextResponse.json(
			{ message: "the code was not sent", code: context.failure },
			{ status: context.failure === "TOO_MANY_REQUESTS" ? 429 : 400 },
		)
	}

	return NextResponse.json({ message: "code sent" })
}
