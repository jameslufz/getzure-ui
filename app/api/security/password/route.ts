import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth } from "@/app/lib/auth";
import { isRateLimited } from "@/app/lib/rate-limit";
import { getUserContact } from "@/app/lib/user-contact";
import { parseJsonBody, passwordBodySchema } from "@/app/lib/validation";

// Calling auth.api directly skips better-auth's own limiter. Better-auth already caps wrong codes
// per code, but this also stops someone from requesting fresh codes and guessing them forever.
const PASSWORD_WINDOW_MS = 15 * 60 * 1000
const PASSWORD_MAX_ATTEMPTS = 5

type TPostPassword = (request: NextRequest) => Promise<NextResponse>

// Sets a new password after the user proves it's them with a code sent to their phone or email.
// Also covers phone and Google sign-ups, who have no password yet: the first one is created here.
export const POST: TPostPassword = async (request) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
	}

	const parsed = await parseJsonBody(request, passwordBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "invalid method, code or newPassword", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	if (isRateLimited(`password:${session.user.id}`, PASSWORD_MAX_ATTEMPTS, PASSWORD_WINDOW_MS)) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	const { method, code, newPassword } = parsed.data
	const contact = await getUserContact(session.user.id)

	try {
		if (method === "phone" && contact.phoneNumber) {
			await auth.api.resetPasswordPhoneNumber({
				body: { phoneNumber: contact.phoneNumber, otp: code, newPassword },
			})
		} else if (method === "email" && contact.email) {
			await auth.api.resetPasswordEmailOTP({
				body: { email: contact.email, otp: code, password: newPassword },
			})
		} else {
			return NextResponse.json(
				{ message: "this method is not available", code: "VERIFY_METHOD_UNAVAILABLE" },
				{ status: 400 },
			)
		}

		// The old password may be the reason it's being changed, so every other device is signed out.
		await auth.api.revokeOtherSessions({ headers: request.headers })
	} catch (err) {
		if (err instanceof APIError) {
			return NextResponse.json(
				{ message: err.body?.message, code: err.body?.code },
				{ status: err.statusCode },
			)
		}
		return NextResponse.json(
			{ message: "failed to save password", code: "UNEXPECTED_ERROR" },
			{ status: 500 },
		)
	}

	return NextResponse.json({ message: "saved" })
}
