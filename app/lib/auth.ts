import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "@/app/lib/db";

type TOtpRefContext = { ref: string }
export const otpRefStorage = new AsyncLocalStorage<TOtpRefContext>()

export const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	plugins: [
		phoneNumber({
			sendOTP: ({ phoneNumber, code }) => {
				// DEV STUB: no SMS provider wired up yet — log the code
				// instead of sending a real text. Swap this for a real
				// provider (Twilio, etc.) before going to production.
				const store = otpRefStorage.getStore()
				const otpRef = store ? store.ref : generateOTPRef()
				console.log(`[dev] OTP for ${phoneNumber}: ${code} (OTP Reference is ${otpRef})`)
			},
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => `${phoneNumber}@phone.getzure.com`,
				getTempName: (phoneNumber) => phoneNumber,
			},
		}),
	],
})

type TGenerateOTPRef = (length?: number) => string
export const generateOTPRef: TGenerateOTPRef = (length = 6) => {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ023456789"
	const bytes = crypto.randomBytes(length)
	let result = ""

	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length]
	}

	return result
}
