import z from "zod";

import { NATIONAL_ID_PATTERN } from "@/app/lib/validation-rules.generated";

// The sign-up and ID-verification rules (patterns, lengths, bank codes, image limits) are generated
// from the Go service, which is where they are enforced; see validation-rules.generated.ts.
export * from "@/app/lib/validation-rules.generated"

// Rules for the Next API routes that stay here (sign-up OTP, password, two-factor).
export const PHONE_NUMBER_PATTERN = /^(06|08|09)\d{8}$/

type TIsValidNationalId = (id: string) => boolean

// Thai national ID check digit: the first 12 digits weighted 13..2, then (11 - sum % 11) % 10.
// An algorithm can't be generated as data, so this mirrors validation.NationalID in the Go service.
export const isValidNationalId: TIsValidNationalId = (id) => {
	if (!NATIONAL_ID_PATTERN.test(id)) return false

	const sum = Array.from(id.slice(0, 12)).reduce((total, digit, index) => {
		return total + Number(digit) * (13 - index)
	}, 0)

	return (11 - (sum % 11)) % 10 === Number(id[12])
}

export const sendPhoneOtpBodySchema = z.object({
	phoneNumber: z.string().regex(PHONE_NUMBER_PATTERN),
})

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_LETTER_AND_DIGIT_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/

// Letters and digits are both required; the length range matches better-auth's own limits.
const newPasswordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH)
	.max(PASSWORD_MAX_LENGTH)
	.regex(/[A-Za-z]/)
	.regex(/\d/)

export const TWO_FACTOR_CHANNELS = ["email", "phone"] as const

export type TTwoFactorChannel = (typeof TWO_FACTOR_CHANNELS)[number]

export const TWO_FACTOR_FACTORS = ["email", "phone", "totp"] as const

export type TTwoFactorFactor = (typeof TWO_FACTOR_FACTORS)[number]

export const PASSWORD_VERIFY_METHODS = ["phone", "email"] as const

export type TPasswordVerifyMethod = (typeof PASSWORD_VERIFY_METHODS)[number]

export const sendTwoFactorCodeBodySchema = z.object({
	channel: z.enum(TWO_FACTOR_CHANNELS),
})

// The authenticator app is switched on through better-auth's own setup flow (QR code, then a
// code), so this route only ever turns it off.
export const twoFactorBodySchema = z
	.object({
		factor: z.enum(TWO_FACTOR_FACTORS),
		enabled: z.boolean(),
		password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
	})
	.refine((body) => !(body.factor === "totp" && body.enabled))

export const verifyPasswordBodySchema = z.object({
	password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

export const sendPasswordCodeBodySchema = z.object({
	method: z.enum(PASSWORD_VERIFY_METHODS),
})

// The code proves who is asking, so the current password is not needed.
export const passwordBodySchema = z.object({
	method: z.enum(PASSWORD_VERIFY_METHODS),
	code: z.string().regex(/^\d{4,8}$/),
	newPassword: newPasswordSchema,
})

type TParseJsonBody = <T extends z.ZodType>(
	request: Request,
	schema: T,
) => Promise<z.ZodSafeParseResult<z.output<T>>>

// Malformed or empty JSON is treated as `undefined`, so it fails validation like any bad body.
export const parseJsonBody: TParseJsonBody = async (request, schema) => {
	const body: unknown = await request.json().catch(() => undefined)
	return schema.safeParse(body)
}
