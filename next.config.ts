import type { NextConfig } from "next";

const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]

// The service worker must always be fetched fresh, and it may only load scripts from this site.
const SERVICE_WORKER_HEADERS = [
	{ key: "Content-Type", value: "application/javascript; charset=utf-8" },
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
]

// Private areas also tell search engines not to index or cache them, besides robots.txt.
const nextConfig: NextConfig = {
	async headers() {
		const privateAreas = ["/dashboard/:path*", "/order/:path*", "/api/:path*"].map(
			(source) => ({
				source,
				headers: NOINDEX,
			}),
		)
		return [...privateAreas, { source: "/sw.js", headers: SERVICE_WORKER_HEADERS }]
	},
}

export default nextConfig
