"use client"

import { useEffect, useState } from "react";
import { serviceFetch } from "@/app/lib/session";
import { TSecurityLevel } from "@/app/lib/security-level";

export type TSecurityStatus = {
	hasPassword: boolean
	email: string | null
	phone: string | null
	emailVerified: boolean
	emailOtpEnabled: boolean
	phoneOtpEnabled: boolean
	totpEnabled: boolean
	passkeyCount: number
	twoFactorPrimary: string | null
	level: TSecurityLevel
}

type TUseSecurityStatus = () => { status: TSecurityStatus | null; refresh: () => void }

// Loads the security status from the Go service and reloads it whenever `refresh` is called (after an action changes the account).
export const useSecurityStatus: TUseSecurityStatus = () => {
	const [status, setStatus] = useState<TSecurityStatus | null>(null)
	const [version, setVersion] = useState(0)

	useEffect(() => {
		const loadStatus = async () => {
			try {
				const res = await serviceFetch("/security")
				if (res.ok) setStatus(await res.json())
			} catch {}
		}
		loadStatus()
	}, [version])

	const refresh = () => setVersion((current) => current + 1)

	return { status, refresh }
}
