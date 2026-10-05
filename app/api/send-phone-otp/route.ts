import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth, generateOTPRef, otpRefStorage } from "@/app/lib/auth";
import { getClientIp, isRateLimited } from "@/app/lib/rate-limit";
import { parseJsonBody, sendPhoneOtpBodySchema } from "@/app/lib/validation";

// Calling auth.api directly skips better-auth's own HTTP rate limiter, and every OTP is a
// paid SMS, so this route limits itself. Per phone protects one victim from being spammed;
// per IP slows down someone cycling through many numbers.
const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_MAX_PER_PHONE = 5
const OTP_MAX_PER_IP = 20

type TPostSendPhoneOtp = (request: NextRequest) => Promise<NextResponse>

export const POST: TPostSendPhoneOtp = async (request) => {
	const parsed = await parseJsonBody(request, sendPhoneOtpBodySchema)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "a valid phoneNumber is required", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	const { phoneNumber } = parsed.data
	const ip = getClientIp(request.headers)

	if (
		isRateLimited(`send-otp:ip:${ip}`, OTP_MAX_PER_IP, OTP_WINDOW_MS) ||
		isRateLimited(`send-otp:phone:${phoneNumber}`, OTP_MAX_PER_PHONE, OTP_WINDOW_MS)
	) {
		return NextResponse.json(
			{ message: "too many requests", code: "TOO_MANY_REQUESTS" },
			{ status: 429 },
		)
	}

	const otpRef = generateOTPRef()

	try {
		await otpRefStorage.run({ ref: otpRef }, () =>
			auth.api.sendPhoneNumberOTP({ body: { phoneNumber } }),
		)
	} catch (err) {
		if (err instanceof APIError) {
			return NextResponse.json(
				{ message: err.body?.message, code: err.body?.code },
				{ status: err.statusCode },
			)
		}
		return NextResponse.json(
			{ message: "failed to send otp", code: "UNEXPECTED_ERROR" },
			{ status: 500 },
		)
	}

	return NextResponse.json({ message: "code sent", otpRef })
}
