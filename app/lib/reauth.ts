// The password the person typed to open the two-factor settings, kept in memory only (never in
// storage) for a few minutes so each change doesn't ask for it again. It survives moving between
// pages of the app, and disappears on a refresh, a sign-out or when the time is up.
// The server still checks the password on every change, so this only saves typing; it is not what
// protects the account.
const REAUTH_DURATION_MS = 5 * 60 * 1000

export type TReauth = { password: string; expiresAt: number }

type TStartReauth = (password: string) => void
type TClearReauth = () => void
type TGetReauth = () => TReauth | null
type TSubscribeReauth = (listener: () => void) => () => void

let current: TReauth | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

export const clearReauth: TClearReauth = () => {
	clearTimeout(timer)
	current = null
	notify()
}

export const startReauth: TStartReauth = (password) => {
	clearTimeout(timer)
	current = { password, expiresAt: Date.now() + REAUTH_DURATION_MS }
	timer = setTimeout(clearReauth, REAUTH_DURATION_MS)
	notify()
}

export const subscribeReauth: TSubscribeReauth = (listener) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export const getReauth: TGetReauth = () => current
export const getServerReauth: TGetReauth = () => null
