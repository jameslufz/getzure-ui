import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth";
import { auth, generateOTPRef, otpRefStorage } from "@/app/lib/auth";

export const POST = async (request: NextRequest) => {
	const { phoneNumber } = await request.json()

	if (!phoneNumber) {
		return NextResponse.json({ message: "phoneNumber is required", code: "VALIDATION_ERROR" }, { status: 400 })
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
		return NextResponse.json({ message: "failed to send otp", code: "UNEXPECTED_ERROR" }, { status: 500 })
	}

	return NextResponse.json({ message: "code sent", otpRef })
}