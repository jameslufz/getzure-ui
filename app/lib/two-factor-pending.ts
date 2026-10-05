// A password sign-in for an account with two-factor on does not create a session. It leaves a
// signed "two_factor" cookie pointing at a short-lived record that names the user. These helpers
// read that record, so code that runs before the second step finishes knows who is mid-login.
const PENDING_COOKIE_NAME = "two_factor"

export type TPendingTwoFactor = { identifier: string; userId: string }

type TPendingContext = {
	getSignedCookie: (name: string, secret: string) => Promise<string | false | null | undefined>
	context: {
		secret: string
		createAuthCookie: (name: string) => { name: string }
		internalAdapter: {
			findVerificationValue: (
				identifier: string,
			) => Promise<{ value: string; expiresAt: Date } | null>
		}
	}
}

type TGetPendingTwoFactor = (ctx: TPendingContext) => Promise<TPendingTwoFactor | null>

export const getPendingTwoFactor: TGetPendingTwoFactor = async (ctx) => {
	const cookie = ctx.context.createAuthCookie(PENDING_COOKIE_NAME)
	const identifier = await ctx.getSignedCookie(cookie.name, ctx.context.secret)
	if (!identifier) return null

	const record = await ctx.context.internalAdapter.findVerificationValue(identifier)
	if (!record || record.expiresAt < new Date()) return null

	return { identifier, userId: record.value }
}
