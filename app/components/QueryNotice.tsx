import { ReactNode } from "react";
import { T } from "@/app/i18n/T";

type TQueryNoticeProps = {
	// "unavailable": the answer was null (missing or not allowed). "failed": the request failed.
	kind: "unavailable" | "failed"
	onRetry?: () => void
}
type TQueryNotice = (props: TQueryNoticeProps) => ReactNode

export const QueryNotice: TQueryNotice = ({ kind, onRetry }) => {
	return (
		<div className="card flex flex-col items-center gap-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
			{kind === "unavailable" ? (
				<T k="query.unavailable">ข้อมูลยังไม่พร้อมแสดง</T>
			) : (
				<T k="query.failed">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</T>
			)}
			{kind === "failed" && onRetry && (
				<button type="button" onClick={onRetry} className="btn-outline w-auto">
					<T k="query.retry">ลองใหม่</T>
				</button>
			)}
		</div>
	)
}
