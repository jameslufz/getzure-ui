import { clientServiceUrl } from "@/app/lib/client-service";

export const GUEST_KEY_HEADER = "X-Order-Key"

type TGuestOrderLink = (origin: string, orderId: string, key: string) => string
type TGuestFetch = (path: string, key: string, signal?: AbortSignal) => Promise<Response>

// The key sits after # so it is never sent to our server, logs or other sites in a Referer.
export const guestOrderLink: TGuestOrderLink = (origin, orderId, key) => {
	return `${origin}/order/${orderId}#${key}`
}

// A guest has no session, so this sends the key and no cookies, and never starts a sign-in redirect.
export const guestFetch: TGuestFetch = (path, key, signal) => {
	return fetch(clientServiceUrl(`/guest/orders${path}`), {
		headers: { [GUEST_KEY_HEADER]: key },
		credentials: "omit",
		signal,
	})
}
