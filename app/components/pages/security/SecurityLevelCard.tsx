import { ReactNode } from "react";
import clsx from "clsx";
import { T } from "@/app/i18n/T";
import { TSecurityLevel } from "@/app/lib/security-level";

type TSecurityLevelCardProps = { level: TSecurityLevel }
type TSecurityLevelCard = (props: TSecurityLevelCardProps) => ReactNode
type TLevelStyle = {
	filledBars: number
	text: string
	bar: string
	label: ReactNode
	hint: ReactNode
}

const LEVEL_STYLES: Record<TSecurityLevel, TLevelStyle> = {
	low: {
		filledBars: 1,
		text: "text-rose-600 dark:text-rose-400",
		bar: "bg-rose-500",
		label: <T k="security.level.low">ต่ำ</T>,
		hint: (
			<T k="security.level.low.hint">
				เปิดใช้งานความปลอดภัยอย่างน้อยหนึ่งแบบเพื่อปกป้องบัญชีของคุณ
			</T>
		),
	},
	medium: {
		filledBars: 2,
		text: "text-orange-600 dark:text-orange-400",
		bar: "bg-orange-500",
		label: <T k="security.level.medium">กลาง</T>,
		hint: (
			<T k="security.level.medium.hint">
				เปิดใช้งานให้ครบทุกวิธีที่ใช้ได้เพื่อความปลอดภัยสูงสุด
			</T>
		),
	},
	high: {
		filledBars: 3,
		text: "text-emerald-600 dark:text-emerald-400",
		bar: "bg-emerald-500",
		label: <T k="security.level.high">สูง</T>,
		hint: (
			<T k="security.level.high.hint">
				บัญชีของคุณเปิดใช้งานความปลอดภัยครบทุกวิธีที่ใช้ได้แล้ว
			</T>
		),
	},
}

const TOTAL_BARS = 3

export const SecurityLevelCard: TSecurityLevelCard = ({ level }) => {
	const style = LEVEL_STYLES[level]

	return (
		<div className="card space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
					<T k="security.level.title">ระดับความปลอดภัยของบัญชี</T>
				</p>
				<p className={clsx("text-sm font-semibold", style.text)}>{style.label}</p>
			</div>
			<div className="flex gap-1.5">
				{Array.from({ length: TOTAL_BARS }, (_, index) => (
					<div
						key={index}
						className={clsx(
							"h-2 flex-1 rounded-full",
							index < style.filledBars ? style.bar : "bg-zinc-200 dark:bg-zinc-700",
						)}
					/>
				))}
			</div>
			<p className="text-xs text-zinc-500 dark:text-zinc-400">{style.hint}</p>
		</div>
	)
}
