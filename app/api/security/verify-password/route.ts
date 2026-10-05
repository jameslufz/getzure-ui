import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth } from "@/app/lib/auth";
import { isRateLimited } from "@/app/lib/rate-limit";
import { parseJsonBody, verifyPasswordBodySchema } from "@/app/lib/validation";

// Guessing the password from a stolen session is what this limit is for, so it is keyed by user.
const VERIFY_WINDOW_MS = 15 * 60 * 1000
const VERIFY_MAX_ATTEMPTS = 10

type TPostVerifyPassword = (request: NextRequest) => Promise<NextResponse>

// Checks the signed-in user's password and changes nothing. The two-factor settings page uses it
// to open up front, so a wrong password is caught before any setting is touched.
export const POST: TPostVerifyPassword = async (request) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
	}

	const parsed = await parseJsonBody(request, verifyPasswordBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "password is required", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	if (
		isRateLimited(`verify-password:${session.user.id}`, VERIFY_MAX_ATTEMPTS, VERIFY_WINDOW_MS)
	) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	try {
		await auth.api.verifyPassword({
			body: { password: parsed.data.password },
			headers: request.headers,
		})
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

	return NextResponse.json({ message: "ok" })
}
