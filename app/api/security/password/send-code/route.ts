import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth } from "@/app/lib/auth";
import { isRateLimited } from "@/app/lib/rate-limit";
import { getUserContact } from "@/app/lib/user-contact";
import { parseJsonBody, sendPasswordCodeBodySchema } from "@/app/lib/validation";

// Every code is a paid SMS or an email, so sending is limited per user, not per IP.
const SEND_CODE_WINDOW_MS = 10 * 60 * 1000
const SEND_CODE_MAX = 5

type TPostSendCode = (request: NextRequest) => Promise<NextResponse>

// Sends a one-time code to the account's own phone or email. The destination always comes from
// the session, never from the request, so a code can't be sent to a number the caller picks.
export const POST: TPostSendCode = async (request) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
	}

	const parsed = await parseJsonBody(request, sendPasswordCodeBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "method must be phone or email", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	if (isRateLimited(`password-code:${session.user.id}`, SEND_CODE_MAX, SEND_CODE_WINDOW_MS)) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	const { method } = parsed.data
	const contact = await getUserContact(session.user.id)

	try {
		if (method === "phone" && contact.phoneNumber) {
			await auth.api.requestPasswordResetPhoneNumber({
				body: { phoneNumber: contact.phoneNumber },
			})
		} else if (method === "email" && contact.email) {
			await auth.api.requestPasswordResetEmailOTP({ body: { email: contact.email } })
		} else {
			return NextResponse.json(
				{ message: "this method is not available", code: "VERIFY_METHOD_UNAVAILABLE" },
				{ status: 400 },
			)
		}
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

	return NextResponse.json({ message: "code sent" })
}
