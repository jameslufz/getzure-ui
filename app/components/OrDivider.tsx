import { ReactNode } from "react";
import { T } from "@/app/i18n/T";

type TOrDivider = () => ReactNode

export const OrDivider: TOrDivider = () => {
	return (
		<div className="flex items-center gap-3">
			<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
			<span className="text-xs text-zinc-400 dark:text-zinc-500">
				<T k="auth.orContinueWith">หรือดำเนินการต่อด้วย</T>
			</span>
			<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
		</div>
	)
}
