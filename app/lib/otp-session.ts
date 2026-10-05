"use client"

import { useEffect, useState } from "react";

// What the phone-OTP screens (sign-up and add-a-phone) remember in the browser, so a refresh or a
// return visit lands back on the code step with the same Ref and the same resend countdown
// instead of sending (and paying for) another SMS.
export const OTP_SESSION_TTL_MS = 5 * 60 * 1000
export const RESEND_COOLDOWN_SECONDS = 60

export type TOtpStorage = {
	phoneNumber: string
	otpRef: string
	otpSentAt: number
	resendAvailableAt: number
}

type TOtpStore = {
	save: (data: TOtpStorage) => void
	read: () => TOtpStorage | null
	clear: () => void
}
type TCreateOtpStorage = (key: string) => TOtpStore
type TIsOtpSessionExpired = (stored: TOtpStorage) => boolean
type TGetResendWindow = () => { now: number; availableAt: number }
type TFormatCountdown = (totalSeconds: number) => string
type TUseSecondsUntil = (timestamp: number) => number

// Every screen uses its own key, so one flow never resumes the other's code. Storage can be
// blocked (private windows), so every call is wrapped and the screen still works without it.
export const createOtpStorage: TCreateOtpStorage = (key) => {
	return {
		save: (data) => {
			try {
				localStorage.setItem(key, JSON.stringify(data))
			} catch {}
		},
		read: () => {
			try {
				const raw = localStorage.getItem(key)
				return raw ? JSON.parse(raw) : null
			} catch {
				return null
			}
		},
		clear: () => {
			try {
				localStorage.removeItem(key)
			} catch {}
		},
	}
}

export const isOtpSessionExpired: TIsOtpSessionExpired = (stored) => {
	return Date.now() - stored.otpSentAt > OTP_SESSION_TTL_MS
}

export const getResendWindow: TGetResendWindow = () => {
	const now = Date.now()
	return { now, availableAt: now + RESEND_COOLDOWN_SECONDS * 1000 }
}

export const formatCountdown: TFormatCountdown = (totalSeconds) => {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

// Seconds left until a moment in time (a resend allowed, an unlock ending), ticking once a second.
export const useSecondsUntil: TUseSecondsUntil = (timestamp) => {
	const [cooldown, setCooldown] = useState(0)

	useEffect(() => {
		const tick = () => {
			setCooldown(Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)))
		}
		tick()

		if (timestamp <= Date.now()) {
			return
		}

		const interval = setInterval(tick, 1000)
		return () => clearInterval(interval)
	}, [timestamp])

	return cooldown
}
