import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { phoneNumber, customSession, twoFactor, emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "@/app/lib/db";
import { isRateLimited } from "@/app/lib/rate-limit";
import { getPendingTwoFactor } from "@/app/lib/two-factor-pending";
import { startTwoFactorChallenge } from "@/app/lib/two-factor-challenge";
import { syncTwoFactorFlag } from "@/app/lib/two-factor";
import { twoFactorOptions } from "@/app/lib/two-factor-options";
import { PHONE_NUMBER_PATTERN, TTwoFactorChannel } from "@/app/lib/validation";
import { getUserContact } from "@/app/lib/user-contact";
import { createPlaceholderEmail, isPlaceholderEmail } from "@/app/lib/user-email";

const appUrl = new URL(process.env.BETTER_AUTH_URL as string)

// Better-auth paths that only exist because a plugin ships them. The UI never calls them over
// HTTP, and each one is a way to sign in or reset a password with just a code (no session, no
// password, no two-factor). Our own routes call the same logic through auth.api, which stays
// available because only the HTTP router honours this list.
const DISABLED_PATHS = [
	"/email-otp/send-verification-otp",
	"/email-otp/check-verification-otp",
	"/email-otp/verify-email",
	"/sign-in/email-otp",
	"/email-otp/request-password-reset",
	"/forget-password/email-otp",
	"/email-otp/reset-password",
	"/phone-number/request-password-reset",
	"/phone-number/reset-password",
	// Our own routes own the second-factor settings and the sign-in code sender, because
	// better-auth keeps a single on/off flag and one code channel. Turning off one factor here
	// would wipe all of them, and the stock send-otp has no way to pick email or SMS.
	"/two-factor/disable",
	"/two-factor/send-otp",
	"/two-factor/get-totp-uri",
]

const EMAIL_CHANGE_PATHS = ["/email-otp/request-email-change", "/email-otp/change-email"]

// Passkeys are a second step, never a way to sign in on their own. Better-auth ships these two
// endpoints as a full passwordless login, so they only work in the middle of a password sign-in.
const PASSKEY_LOGIN_PATHS = [
	"/passkey/generate-authenticate-options",
	"/passkey/verify-authentication",
]
const PASSKEY_CHANGE_PATHS = ["/passkey/verify-registration", "/passkey/delete-passkey"]

const PHONE_VERIFY_PATH = "/phone-number/verify"
const SOCIAL_CALLBACK_PREFIX = "/callback/"
const SOCIAL_TOKEN_SIGN_IN_PATH = "/sign-in/social"

type TGetTwoFactorUrl = (returned: unknown) => string

// Where Google's redirect goes instead: the second step, keeping the `redirect` page (if any)
// that the original callback URL carried.
const getTwoFactorUrl: TGetTwoFactorUrl = (returned) => {
	const headers = (returned as { headers?: HeadersInit } | undefined)?.headers
	const location = headers ? new Headers(headers).get("location") : null
	const redirectTo = location ? new URL(location, appUrl).searchParams.get("redirect") : null

	const url = new URL("/sign-in/two-factor", appUrl)
	if (redirectTo) url.searchParams.set("redirect", redirectTo)

	return url.toString()
}

type TOtpRefContext = { ref: string }
export const otpRefStorage = new AsyncLocalStorage<TOtpRefContext>()

// Which channel the sign-in 2FA code goes to, set by /api/two-factor/send-code around the call.
// Better-auth swallows errors thrown by the sender and still answers "sent", so the sender
// reports why it did not send through `failure`, and the route reads it back.
export type TTwoFactorSendFailure = "CHANNEL_NOT_ENABLED" | "TOO_MANY_REQUESTS"
export type TTwoFactorChannelContext = {
	channel: TTwoFactorChannel
	failure?: TTwoFactorSendFailure
}
export const twoFactorChannelStorage = new AsyncLocalStorage<TTwoFactorChannelContext>()

const TWO_FACTOR_SEND_WINDOW_MS = 10 * 60 * 1000
const TWO_FACTOR_SEND_MAX = 5

export const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			// Which channels get the sign-in code. Not settable through /update-user (input: false).
			emailOtpEnabled: { type: "boolean", defaultValue: false, input: false },
			phoneOtpEnabled: { type: "boolean", defaultValue: false, input: false },
			// The method offered first at the sign-in 2FA step (null = automatic). Set by the Go service.
			twoFactorPrimary: { type: "string", required: false, input: false },
		},
	},
	disabledPaths: DISABLED_PATHS,
	hooks: {
		// These endpoints are reachable directly under /api/auth, so the rules live here and
		// not only in the UI.
		before: createAuthMiddleware(async (ctx) => {
			// OTP channels are switched on by /api/security/two-factor, which also checks the
			// channel's destination. Through this endpoint the flag would turn on with no channel.
			if (ctx.path === "/two-factor/enable" && ctx.body?.method === "otp") {
				throw new APIError("BAD_REQUEST", {
					message: "use the OTP settings",
					code: "USE_OTP_ROUTE",
				})
			}

			if (PASSKEY_LOGIN_PATHS.includes(ctx.path)) {
				const pending = await getPendingTwoFactor(ctx)

				if (!pending) {
					throw new APIError("UNAUTHORIZED", {
						message: "sign in with your password first",
						code: "TWO_FACTOR_REQUIRED",
					})
				}

				// The passkey has to belong to the person who just entered the password.
				if (ctx.path === "/passkey/verify-authentication") {
					const { rows } = await pool.query(
						`select "userId" from passkey where "credentialID" = $1`,
						[ctx.body?.response?.id],
					)

					if (rows[0]?.userId !== pending.userId) {
						throw new APIError("UNAUTHORIZED", {
							message: "this passkey is not allowed",
							code: "PASSKEY_NOT_ALLOWED",
						})
					}
				}
			}

			// Adding a phone number makes it a way to sign in (a code to that number opens the
			// account) and a place 2FA codes go. A hijacked session must not be able to plant its own,
			// so it can only be added while the account has no verified number.
			if (ctx.path === PHONE_VERIFY_PATH && ctx.body?.updatePhoneNumber) {
				const session = await getSessionFromCtx(ctx)
				if (session) {
					const { rows } = await pool.query(
						`select coalesce("phoneNumberVerified", false) as verified from "user" where id = $1`,
						[session.user.id],
					)

					if (rows[0]?.verified) {
						throw new APIError("BAD_REQUEST", {
							message: "phone number is already set",
							code: "PHONE_ALREADY_SET",
						})
					}
				}
			}

			if (!EMAIL_CHANGE_PATHS.includes(ctx.path)) return

			const session = await getSessionFromCtx(ctx)
			if (!session) return

			// A hijacked session must not be able to repoint the address that receives 2FA codes.
			if (!isPlaceholderEmail(session.user.email)) {
				throw new APIError("BAD_REQUEST", {
					message: "email is already set",
					code: "EMAIL_ALREADY_SET",
				})
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			// Better-auth adds and removes passkeys itself, so the 2FA flag is recomputed here.
			// Without it, deleting the only factor would leave 2FA on with nothing to pass it.
			if (PASSKEY_CHANGE_PATHS.includes(ctx.path)) {
				const session = await getSessionFromCtx(ctx)
				if (session) await syncTwoFactorFlag(session.user.id)
			}

			// Sign-ins that skip the password (Google, a phone OTP) still owe the second step when the
			// account has two-factor on. Better-auth only enforces it for password sign-ins.
			const signedIn = ctx.context.newSession
			const skipsPasswordStep =
				ctx.path === PHONE_VERIFY_PATH ||
				ctx.path === SOCIAL_TOKEN_SIGN_IN_PATH ||
				ctx.path.startsWith(SOCIAL_CALLBACK_PREFIX)

			if (skipsPasswordStep && signedIn?.user.twoFactorEnabled) {
				await startTwoFactorChallenge(ctx, signedIn)

				if (ctx.path.startsWith(SOCIAL_CALLBACK_PREFIX)) {
					// Google finishes with a redirect; send it to the second step instead, keeping the
					// page the person was heading to.
					throw ctx.redirect(getTwoFactorUrl(ctx.context.returned))
				}

				return ctx.json({ twoFactorRedirect: true, twoFactorMethods: [] })
			}

			// A finished passkey step uses up the pending login, so it can't be replayed.
			if (ctx.path === "/passkey/verify-authentication" && ctx.context.newSession) {
				const pending = await getPendingTwoFactor(ctx)
				if (pending) {
					await ctx.context.internalAdapter.deleteVerificationByIdentifier(
						pending.identifier,
					)
					await ctx.context.internalAdapter.deleteVerificationByIdentifier(
						`2fa-attempts-${pending.identifier}`,
					)
				}
			}
		}),
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	plugins: [
		phoneNumber({
			// Also guards better-auth's own /api/auth/phone-number/* endpoints, not just our route.
			phoneNumberValidator: (phoneNumber) => PHONE_NUMBER_PATTERN.test(phoneNumber),
			sendOTP: ({ phoneNumber, code }) => {
				// DEV STUB: logs the code instead of sending a real SMS.
				const store = otpRefStorage.getStore()
				const otpRef = store ? store.ref : generateOTPRef()
				console.log(`[dev] OTP for ${phoneNumber}: ${code} (OTP Reference is ${otpRef})`)
			},
			sendPasswordResetOTP: ({ phoneNumber, code }) => {
				// DEV STUB: logs the code instead of sending a real SMS.
				console.log(`[dev] password reset OTP for ${phoneNumber}: ${code}`)
			},
			signUpOnVerification: {
				getTempEmail: createPlaceholderEmail,
				getTempName: (phoneNumber) => phoneNumber,
			},
		}),
		twoFactorOptions(),
		emailOTP({
			changeEmail: { enabled: true },
			storeOTP: "hashed",
			sendVerificationOTP: async ({ email, otp, type }) => {
				// DEV STUB: logs the code instead of sending a real email.
				console.log(`[dev] email OTP (${type}) for ${email}: ${otp}`)
			},
		}),
		twoFactor({
			issuer: "Getzure",
			otpOptions: {
				storeOTP: "hashed",
				sendOTP: async ({ user, otp }) => {
					const store = twoFactorChannelStorage.getStore()
					const channel = store?.channel

					if (
						isRateLimited(
							`2fa-send:${user.id}`,
							TWO_FACTOR_SEND_MAX,
							TWO_FACTOR_SEND_WINDOW_MS,
						)
					) {
						if (store) store.failure = "TOO_MANY_REQUESTS"
						return
					}

					// The destination comes from the database, never from the request.
					const { rows } = await pool.query(
						`select "emailVerified", "emailOtpEnabled", "phoneOtpEnabled" from "user" where id = $1`,
						[user.id],
					)
					const settings = rows[0]
					const contact = await getUserContact(user.id)

					if (
						channel === "email" &&
						settings.emailOtpEnabled &&
						settings.emailVerified &&
						contact.email
					) {
						// DEV STUB: logs the code instead of sending a real email.
						console.log(`[dev] 2FA email OTP for ${contact.email}: ${otp}`)
					} else if (
						channel === "phone" &&
						settings.phoneOtpEnabled &&
						contact.phoneNumber
					) {
						// DEV STUB: logs the code instead of sending a real SMS.
						console.log(`[dev] 2FA SMS OTP for ${contact.phoneNumber}: ${otp}`)
					} else if (store) {
						store.failure = "CHANNEL_NOT_ENABLED"
					}
				},
			},
		}),
		passkey({
			rpID: appUrl.hostname,
			rpName: "Getzure",
			origin: appUrl.origin,
		}),
		customSession(async ({ user, session }) => {
			const { rows } = await pool.query(
				`select full_name_th, full_name_en, bank, bank_account_no, bank_acocunt_name, kyc
				 from user_info where user_id = $1`,
				[user.id],
			)
			return { user: { ...user, userInfo: rows[0] || null }, session }
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
