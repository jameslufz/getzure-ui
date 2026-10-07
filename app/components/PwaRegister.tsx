"use client"

import { useEffect } from "react";

type TPwaRegister = () => null

const isProduction = process.env.NODE_ENV === "production"

// Registers the service worker in production; in development it removes any left over so old files never show.
const PwaRegister: TPwaRegister = () => {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return

		if (isProduction) {
			void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
			return
		}
		void navigator.serviceWorker
			.getRegistrations()
			.then((registrations) =>
				registrations.forEach((registration) => void registration.unregister()),
			)
		void caches
			.keys()
			.then((keys) =>
				keys
					.filter((key) => key.startsWith("getzure-"))
					.forEach((key) => void caches.delete(key)),
			)
	}, [])

	return null
}

export default PwaRegister
