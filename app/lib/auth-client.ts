import { createAuthClient } from "better-auth/react";
import { emailOTPClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { handleSessionExpired } from "@/app/lib/session";

export const authClient = createAuthClient({
	plugins: [phoneNumberClient(), emailOTPClient(), twoFactorClient(), passkeyClient()],
	fetchOptions: {
		// Only acts inside /dashboard, so a wrong password on /sign-in (also a 401) is untouched.
		onError: (ctx) => {
			if (ctx.response.status === 401) handleSessionExpired()
		},
	},
})
