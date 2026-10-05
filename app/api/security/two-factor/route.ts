import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth } from "@/app/lib/auth";
import { hasPassword } from "@/app/lib/credential";
import { isRateLimited } from "@/app/lib/rate-limit";
import { setTwoFactorFactor } from "@/app/lib/two-factor";
import { getUserContact } from "@/app/lib/user-contact";
import { parseJsonBody, twoFactorBodySchema } from "@/app/lib/validation";

// Every call re-checks the password, so this also limits guessing it from a stolen session.
const TWO_FACTOR_WINDOW_MS = 15 * 60 * 1000
const TWO_FACTOR_MAX_ATTEMPTS = 10

type TPostTwoFactor = (request: NextRequest) => Promise<NextResponse>

// Turns the email code, SMS code or authenticator app on or off for the signed-in user.
export const POST: TPostTwoFactor = async (request) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
	}

	const parsed = await parseJsonBody(request, twoFactorBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "invalid factor, enabled or password", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	if (
		isRateLimited(
			`two-factor:${session.user.id}`,
			TWO_FACTOR_MAX_ATTEMPTS,
			TWO_FACTOR_WINDOW_MS,
		)
	) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	const { factor, enabled, password } = parsed.data

	if (!(await hasPassword(session.user.id))) {
		return NextResponse.json(
			{ message: "set a password first", code: "PASSWORD_REQUIRED" },
			{ status: 400 },
		)
	}

	try {
		await auth.api.verifyPassword({ body: { password }, headers: request.headers })
	} catch (err) {
		if (err instanceof APIError) {
			return NextResponse.json(
				{ message: err.body?.message, code: err.body?.code },
				{ status: err.statusCode },
			)
		}
		return NextResponse.json(
			{ message: "failed to check password", code: "UNEXPECTED_ERROR" },
			{ status: 500 },
		)
	}

	// A code can only be sent to a destination that is real and verified.
	if (enabled) {
		const contact = await getUserContact(session.user.id)
		const canReceive =
			factor === "email"
				? !!contact.email && session.user.emailVerified
				: factor === "phone" && !!contact.phoneNumber

		if (!canReceive) {
			return NextResponse.json(
				{ message: "this method is not available", code: "VERIFY_METHOD_UNAVAILABLE" },
				{ status: 400 },
			)
		}
	}

	await setTwoFactorFactor(session.user.id, factor, enabled)

	// Sessions opened before this change never passed the new check, so they are closed.
	await auth.api.revokeOtherSessions({ headers: request.headers })

	return NextResponse.json({ message: "saved" })
}
