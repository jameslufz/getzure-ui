// The ways a user can pass the second step at sign-in, in the order we prefer them when the user
// hasn't picked one: passkey first (phishing-resistant, nothing to type), then the authenticator
// app (no message to wait for), then email, then SMS.
export const TWO_FACTOR_METHODS = ["passkey", "totp", "email", "phone"] as const

export type TTwoFactorMethod = (typeof TWO_FACTOR_METHODS)[number]

type TEnabledMethods = Record<TTwoFactorMethod, boolean>
type TGetEnabledMethodList = (enabled: TEnabledMethods) => TTwoFactorMethod[]
type TGetEffectivePrimary = (
	enabled: TEnabledMethods,
	chosen: string | null,
) => TTwoFactorMethod | null

export const getEnabledMethodList: TGetEnabledMethodList = (enabled) => {
	return TWO_FACTOR_METHODS.filter((method) => enabled[method])
}

// The user's pick if it is still turned on; otherwise the best method that is.
export const getEffectivePrimary: TGetEffectivePrimary = (enabled, chosen) => {
	const available = getEnabledMethodList(enabled)
	const picked = available.find((method) => method === chosen)

	return picked ?? available[0] ?? null
}
