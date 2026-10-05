import { ReactNode } from "react";
import { T } from "@/app/i18n/T";

type TFactorCardProps = {
	title: ReactNode
	subtitle: ReactNode
	enabled?: boolean
	children: ReactNode
}
type TFactorCard = (props: TFactorCardProps) => ReactNode

// Shell shared by every second-factor card: title, description, the "enabled" badge and a body.
export const FactorCard: TFactorCard = ({ title, subtitle, enabled, children }) => {
	return (
		<div className="card space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
						{title}
					</h2>
					<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
				</div>
				{enabled && (
					<span className="badge-success">
						<T k="security.enabled">เปิดใช้งานแล้ว</T>
					</span>
				)}
			</div>
			{children}
		</div>
	)
}
