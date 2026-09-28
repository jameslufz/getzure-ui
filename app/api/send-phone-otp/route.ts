import { NextRequest, NextResponse } from "next/server";
import { auth, otpRefStore } from "@/app/lib/auth";

export const POST = async (request: NextRequest) => {
	const { phoneNumber } = await request.json()

	if (!phoneNumber) {
		return NextResponse.json({ message: "phoneNumber is required" }, { status: 400 })
	}

	try {
		await auth.api.sendPhoneNumberOTP({ body: { phoneNumber } })
	} catch {
		return NextResponse.json({ message: "failed to send otp" }, { status: 400 })
	}

	const otpRef = otpRefStore.get(phoneNumber)
	otpRefStore.delete(phoneNumber)

	return NextResponse.json({ message: "code sent", otpRef })
}