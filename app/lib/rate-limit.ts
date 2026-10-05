// Simple fixed-window rate limiter kept in this process's memory.
// Limits: it resets on restart and is not shared between instances. Fine for a single
// dev/test server; the Go API should replace it with a shared store (e.g. Redis).
type TWindow = { count: number; resetAt: number }

const MAX_TRACKED_KEYS = 10_000
const windows = new Map<string, TWindow>()

type TRemoveExpiredWindows = (now: number) => void

const removeExpiredWindows: TRemoveExpiredWindows = (now) => {
	for (const [key, window] of windows) {
		if (window.resetAt <= now) windows.delete(key)
	}
}

type TIsRateLimited = (key: string, max: number, windowMs: number) => boolean

// Counts one hit for `key` and returns true once it goes over `max` within `windowMs`.
// There is no `await` in here, so the check-and-increment cannot interleave between requests.
export const isRateLimited: TIsRateLimited = (key, max, windowMs) => {
	const now = Date.now()
	const current = windows.get(key)

	if (current && current.resetAt > now) {
		current.count += 1
		return current.count > max
	}

	if (windows.size >= MAX_TRACKED_KEYS) removeExpiredWindows(now)
	windows.set(key, { count: 1, resetAt: now + windowMs })
	return false
}

type TGetClientIp = (headers: Headers) => string

// x-forwarded-for can be forged unless a trusted proxy overwrites it, so an IP key only
// slows down honest-but-noisy clients. Pair it with a key an attacker cannot change.
export const getClientIp: TGetClientIp = (headers) => {
	return headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
}
