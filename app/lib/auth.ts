import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import crypto from "node:crypto";
import { pool } from "@/app/lib/db";

export const otpRefStore = new Map<string, string>()

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
				const otpRef = generateOTPRef()
				otpRefStore.set(phoneNumber, otpRef)
				console.log(`[dev] OTP for ${phoneNumber}: ${code} (OTP Reference is ${otpRef})`)
			},
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => `${phoneNumber}@phone.getzure.com`,
				getTempName: (phoneNumber) => phoneNumber,
			},
		}),
	],
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const signupType = !!user.phoneNumber ? "phone" : "email"
					if (signupType === "email") {
						let firstname, middlename, lastname
						const nameSplited = user.name.split(" ")
						if (nameSplited.length > 0) {
							const hasMid = nameSplited.length > 2
							firstname = nameSplited[0]
							middlename = hasMid ? nameSplited[1] || null : null
							lastname = hasMid ? nameSplited[2] || null : nameSplited[1]

							await pool.query(
								`insert into user_info (user_id, firstname, middlename, lastname) values ($1, $2, $3, $4)`,
								[user.id, firstname, middlename, lastname],
							)
						}
					}
				},
			},
		},
	},
})

type TGenerateOTPRef = (length?: number) => string
const generateOTPRef: TGenerateOTPRef = (length = 6) => {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ023456789"
	const bytes = crypto.randomBytes(length)
	let result = ""

	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length]
	}

	return result
}
