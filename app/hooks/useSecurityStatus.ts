"use client"

import { useQuery } from "@tanstack/react-query";
import { fetchServiceJson, getQueryView, TQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { TSecurityLevel } from "@/app/lib/security-level";
import { useInvalidate } from "@/app/hooks/useInvalidate";

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

type TUseSecurityStatus = () => {
	status: TSecurityStatus | null | undefined
	view: TQueryView
	retry: () => void
	refresh: () => void
}

// The security status from the Go service; `refresh` makes it out of date after an action changes the account.
export const useSecurityStatus: TUseSecurityStatus = () => {
	const { afterSecurityChange } = useInvalidate()
	const query = useQuery({
		queryKey: queryKeys.security,
		queryFn: ({ signal }) => fetchServiceJson<TSecurityStatus>("/security", signal),
	})

	return {
		status: query.data,
		view: getQueryView(query),
		retry: () => query.refetch(),
		refresh: () => afterSecurityChange(),
	}
}
