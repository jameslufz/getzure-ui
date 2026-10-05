import { QueryClient } from "@tanstack/react-query";

// Data stays fresh for 5 minutes; writes invalidate what they change (see use-invalidate.ts).
export const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 30 * 60 * 1000
const MAX_RETRIES = 2
const SERVER_ERROR_STATUS = 500

export class QueryHttpError extends Error {
	status: number
	constructor(status: number) {
		super(`request failed with status ${status}`)
		this.status = status
	}
}

type TShouldRetry = (failureCount: number, error: Error) => boolean
type TMakeQueryClient = () => QueryClient
type TGetQueryClient = () => QueryClient

// A 4xx answer won't change by asking again, so only network and 5xx failures are retried.
const shouldRetry: TShouldRetry = (failureCount, error) => {
	if (error instanceof QueryHttpError && error.status < SERVER_ERROR_STATUS) return false
	return failureCount < MAX_RETRIES
}

const makeQueryClient: TMakeQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: STALE_TIME_MS, gcTime: GC_TIME_MS, retry: shouldRetry },
		},
	})
}

let browserClient: QueryClient | undefined

// One client per browser tab; the server gets a new one each time so users never share a cache.
export const getQueryClient: TGetQueryClient = () => {
	if (typeof window === "undefined") return makeQueryClient()

	browserClient ??= makeQueryClient()
	return browserClient
}
