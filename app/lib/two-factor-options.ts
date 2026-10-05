import { APIError, createAuthEndpoint } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";
import { pool } from "@/app/lib/db";
import { getEffectivePrimary, getEnabledMethodList } from "@/app/lib/two-factor-primary";
import { getPendingTwoFactor } from "@/app/lib/two-factor-pending";

type TTwoFactorOptions = () => BetterAuthPlugin

// Tells the sign-in 2FA step which methods this person turned on and which to offer first.
// Better-auth's own sign-in response can't: it always lists "otp" and never lists passkeys.
// It needs the signed pending-login cookie, so it can't be used to look up other accounts.
export const twoFactorOptions: TTwoFactorOptions = () => {
	return {
		id: "two-factor-options",
		endpoints: {
			getTwoFactorOptions: createAuthEndpoint(
				"/two-factor/options",
				{ method: "GET" },
				async (ctx) => {
					const pending = await getPendingTwoFactor(ctx)

					if (!pending) {
						throw new APIError("UNAUTHORIZED", {
							message: "invalid two factor cookie",
							code: "INVALID_TWO_FACTOR_COOKIE",
						})
					}

					const { rows } = await pool.query(
						`select "emailOtpEnabled", "phoneOtpEnabled", "twoFactorPrimary",
					        (select count(*) from passkey where "userId" = $1) > 0 as has_passkey,
					        exists (select 1 from "twoFactor" t where t."userId" = $1 and t.verified is not false) as has_totp
					 from "user" where id = $1`,
						[pending.userId],
					)
					const user = rows[0]
					const enabled = {
						passkey: user.has_passkey,
						totp: user.has_totp,
						email: user.emailOtpEnabled,
						phone: user.phoneOtpEnabled,
					}

					return ctx.json({
						methods: getEnabledMethodList(enabled),
						primary: getEffectivePrimary(enabled, user.twoFactorPrimary),
					})
				},
			),
		},
	}
}
