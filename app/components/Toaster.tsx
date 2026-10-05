"use client"

import { ReactNode, useSyncExternalStore } from "react";
import { CircleCheck } from "lucide-react";
import { getServerToasts, getToasts, subscribeToasts } from "@/app/lib/toast";

type TToaster = () => ReactNode

export const Toaster: TToaster = () => {
	const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts)

	return (
		<div
			role="status"
			aria-live="polite"
			className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col items-end sm:right-6 sm:bottom-6"
		>
			{toasts.map((toast) => (
				<div key={toast.id} className="toast-wrap" data-leaving={toast.leaving}>
					<div className="toast-clip">
						<div className="toast">
							<CircleCheck className="h-6 w-6 shrink-0 text-emerald-400 dark:text-emerald-600" />
							{toast.message}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
