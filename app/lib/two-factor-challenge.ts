import { createAuthMiddleware } from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { generateRandomString } from "better-auth/crypto";

// Better-auth only asks for the second step after a password sign-in. Google and phone-OTP
// sign-ins create a session straight away, so for accounts with two-factor on we turn that
// session back into a "pending login", exactly like the password flow does: no session cookie,
// just the short-lived signed cookie that /sign-in/two-factor and the verify endpoints expect.
const PENDING_COOKIE_NAME = "two_factor"
const PENDING_MAX_AGE_SECONDS = 600

type TAuthMiddlewareContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
type TSignedInSession = { session: { token: string }; user: { id: string } }
type TStartTwoFactorChallenge = (
	ctx: TAuthMiddlewareContext,
	signedIn: TSignedInSession,
) => Promise<void>

export const startTwoFactorChallenge: TStartTwoFactorChallenge = async (ctx, signedIn) => {
	deleteSessionCookie(ctx, true)
	await ctx.context.internalAdapter.deleteSession(signedIn.session.token)
	ctx.context.setNewSession(null)

	const cookie = ctx.context.createAuthCookie(PENDING_COOKIE_NAME, {
		maxAge: PENDING_MAX_AGE_SECONDS,
	})
	const identifier = `2fa-${generateRandomString(20)}`
	const expiresAt = new Date(Date.now() + PENDING_MAX_AGE_SECONDS * 1000)

	await ctx.context.internalAdapter.createVerificationValue({
		value: signedIn.user.id,
		identifier,
		expiresAt,
	})
	await ctx.context.internalAdapter.createVerificationValue({
		value: "0",
		identifier: `2fa-attempts-${identifier}`,
		expiresAt,
	})
	await ctx.setSignedCookie(cookie.name, identifier, ctx.context.secret, cookie.attributes)
}
