import { ReactNode } from "react";
import clsx from "clsx";
import { CircleCheck } from "lucide-react";
import { T } from "@/app/i18n/T";

type TVerifiedMarkProps = {
	verified: boolean
	official: boolean
	// Where the tooltip opens; "top" for marks near the bottom edge of the screen.
	placement?: "top" | "bottom"
	className?: string
}
type TVerifiedMark = (props: TVerifiedMarkProps) => ReactNode

// Grey: not verified. Green: identity verified. Blue: official account. The tooltip names which.
export const VerifiedMark: TVerifiedMark = ({
	verified,
	official,
	placement = "bottom",
	className,
}) => {
	const color = official
		? "fill-sky-500"
		: verified
			? "fill-emerald-500"
			: "fill-zinc-300 dark:fill-zinc-600"
	const label = official ? (
		<T k="profile.mark.official">บัญชีอย่างเป็นทางการ</T>
	) : verified ? (
		<T k="profile.mark.verified">ยืนยันตัวตนแล้ว</T>
	) : (
		<T k="profile.mark.none">ยังไม่ยืนยันตัวตน</T>
	)

	return (
		<span
			tabIndex={0}
			className={clsx("group relative inline-flex shrink-0 outline-none", className)}
		>
			<CircleCheck className={clsx("h-5 w-5 text-white", color)} aria-hidden="true" />
			<span
				role="tooltip"
				className={clsx(
					"pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-xs font-normal whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-zinc-100 dark:text-zinc-900",
					placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
				)}
			>
				{label}
			</span>
		</span>
	)
}
