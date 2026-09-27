import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
	database: new Pool({
		connectionString: process.env.DATABASE_URL,
	}),
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
				console.log(`[dev] OTP for ${phoneNumber}: ${code}`)
			},
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => `${phoneNumber}@phone.getzure.com`,
				getTempName: (phoneNumber) => phoneNumber,
			},
		}),
	],
})
