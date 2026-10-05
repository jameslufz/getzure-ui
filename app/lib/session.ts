// Client-side helpers for an expired session: verify it is really gone, clear local state, and
// send the user to /sign-in with the page they were on so they land back there after logging in.
import { clientServiceUrl } from "@/app/lib/client-service";
import { clearReauth } from "@/app/lib/reauth";

// Display preferences belong to the browser, not the session, so they survive a sign-out.
const PRESERVED_STORAGE_KEYS = ["theme", "lang"]

const REDIRECT_PARAM = "redirect"
const MAX_REDIRECT_LENGTH = 2000
const AUTH_PAGE_PREFIXES = ["/sign-in", "/sign-up"]

let isRedirecting = false

type TGetSafeRedirectPath = (value: string | null) => string | null
type TGetRedirectFromLocation = () => string | null
type TAppendRedirect = (path: string) => string
type TClearClientSession = () => void
type TIsSessionActive = () => Promise<boolean>
type THandleSessionExpired = () => Promise<void>
type TApiFetch = (input: string, init?: RequestInit) => Promise<Response>
type TServiceFetch = (path: string, init?: RequestInit) => Promise<Response>

// Only same-site paths are allowed, otherwise ?redirect=//evil.com would be an open redirect.
export const getSafeRedirectPath: TGetSafeRedirectPath = (value) => {
	if (!value || value.length > MAX_REDIRECT_LENGTH) return null
	if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null
	if (AUTH_PAGE_PREFIXES.some((prefix) => value.startsWith(prefix))) return null

	const base = "http://redirect.invalid"
	return new URL(value, base).origin === base ? value : null
}

export const getRedirectFromLocation: TGetRedirectFromLocation = () => {
	return getSafeRedirectPath(new URLSearchParams(window.location.search).get(REDIRECT_PARAM))
}

// Keeps ?redirect= alive across steps that leave the page (Google sign-in, the 2FA step).
export const appendRedirect: TAppendRedirect = (path) => {
	const redirectTo = getRedirectFromLocation()
	return redirectTo ? `${path}?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}` : path
}

export const clearClientSession: TClearClientSession = () => {
	Object.keys(localStorage)
		.filter((key) => !PRESERVED_STORAGE_KEYS.includes(key))
		.forEach((key) => localStorage.removeItem(key))
	sessionStorage.clear()
	clearReauth()

	// The session cookie is httpOnly and is cleared by the sign-out call; this covers the rest.
	document.cookie.split(";").forEach((cookie) => {
		const name = cookie.split("=")[0].trim()
		if (name) document.cookie = `${name}=; Max-Age=0; path=/`
	})
}

// A stale client cache can claim "no session" right after a login, so the server decides.
// A network failure counts as "still active": never log someone out because the wifi dropped.
const isSessionActive: TIsSessionActive = async () => {
	try {
		const res = await fetch("/api/auth/get-session", { cache: "no-store" })
		return !res.ok || (await res.json()) !== null
	} catch {
		return true
	}
}

// Safe to call from many places at once (several requests can fail together): it runs once.
export const handleSessionExpired: THandleSessionExpired = async () => {
	if (isRedirecting || !window.location.pathname.startsWith("/dashboard")) return
	isRedirecting = true

	if (await isSessionActive()) {
		isRedirecting = false
		return
	}

	const currentUrl = window.location.pathname + window.location.search

	await fetch("/api/auth/sign-out", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	}).catch(() => {})
	clearClientSession()

	// A full navigation (not router.push) also drops every piece of in-memory state.
	window.location.replace(`/sign-in?${REDIRECT_PARAM}=${encodeURIComponent(currentUrl)}`)
}

// fetch for our own /api routes: a 401 means the session is gone, so start the sign-in redirect.
export const apiFetch: TApiFetch = async (input, init) => {
	const res = await fetch(input, init)
	if (res.status === 401) handleSessionExpired()
	return res
}

// fetch for the Go service. The session cookie is sent along (credentials), and a 401 starts the
// same sign-in redirect as apiFetch.
export const serviceFetch: TServiceFetch = async (path, init) => {
	const res = await fetch(clientServiceUrl(path), { ...init, credentials: "include" })
	if (res.status === 401) handleSessionExpired()
	return res
}
