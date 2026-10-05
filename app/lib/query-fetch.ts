import { QueryHttpError } from "@/app/lib/query-client";
import { serviceFetch } from "@/app/lib/session";

export type TQueryView = "loading" | "unavailable" | "failed" | "ready"
type TQueryState = { data: unknown; isFetching: boolean; isError: boolean }
type TFetchServiceJson = <T>(path: string, signal?: AbortSignal) => Promise<T | null>
type TParseJson = <T>(res: Response) => Promise<T | null>
type TGetQueryView = (query: TQueryState) => TQueryView

// "Not there" and "not yours" are real answers, so they come back as null; other failures throw.
const NULL_STATUSES = [403, 404]

export const parseJsonOrNull: TParseJson = async (res) => {
	if (NULL_STATUSES.includes(res.status)) return null
	if (!res.ok) throw new QueryHttpError(res.status)
	return res.json()
}

export const fetchServiceJson: TFetchServiceJson = async (path, signal) => {
	return parseJsonOrNull(await serviceFetch(path, { signal }))
}

// undefined (or still fetching with nothing to show) = loading, null = nothing to show, error = failed.
export const getQueryView: TGetQueryView = ({ data, isFetching, isError }) => {
	if (data === null) return "unavailable"
	if (data === undefined) return isError && !isFetching ? "failed" : "loading"
	return "ready"
}
