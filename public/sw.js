// getZure service worker: makes the app installable and shows an offline page. It never stores pages, API calls or user data.
const CACHE = "getzure-static-v1"
const OFFLINE_URL = "/offline.html"
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/logo-dark.png", "/logo-light.png"]
const MAX_ENTRIES = 150

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	)
})

// A new version drops the caches of the old ones, then takes over the open tabs.
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith("getzure-") && key !== CACHE)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	)
})

// Keeps the cache small by dropping the oldest runtime entries, never the precached ones.
const trim = async (cache) => {
	const keys = await cache.keys()
	const runtime = keys.filter((request) => !PRECACHE.includes(new URL(request.url).pathname))
	await Promise.all(
		runtime
			.slice(0, Math.max(0, runtime.length - MAX_ENTRIES))
			.map((request) => cache.delete(request)),
	)
}

const store = async (request, response) => {
	if (!response.ok) return
	const cache = await caches.open(CACHE)
	await cache.put(request, response)
	await trim(cache)
}

// Files under /_next/static have a hash in their name, so a cached copy never goes stale.
const cacheFirst = async (request) => {
	const cached = await caches.match(request)
	if (cached) return cached
	const response = await fetch(request)
	await store(request, response.clone())
	return response
}

const staleWhileRevalidate = async (request) => {
	const cached = await caches.match(request)
	const update = fetch(request).then(async (response) => {
		await store(request, response.clone())
		return response
	})
	return cached ?? update
}

self.addEventListener("fetch", (event) => {
	const { request } = event
	const url = new URL(request.url)
	if (request.method !== "GET" || url.origin !== self.location.origin) return

	// Pages always come from the network; the offline page is only the answer when there is none.
	if (request.mode === "navigate") {
		event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
		return
	}
	if (url.pathname.startsWith("/_next/static/")) {
		event.respondWith(cacheFirst(request))
		return
	}
	if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/logo-")) {
		event.respondWith(staleWhileRevalidate(request))
	}
})
