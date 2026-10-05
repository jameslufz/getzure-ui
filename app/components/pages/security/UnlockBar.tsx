import { ReactNode } from "react";
import { LockOpen } from "lucide-react";
import { T } from "@/app/i18n/T";
import { formatCountdown, useSecondsUntil } from "@/app/lib/otp-session";
import { clearReauth, TReauth } from "@/app/lib/reauth";

type TUnlockBarProps = { reauth: TReauth }
type TUnlockBar = (props: TUnlockBarProps) => ReactNode

// Shows how long the settings stay open, and lets the person lock them again sooner.
export const UnlockBar: TUnlockBar = ({ reauth }) => {
	const secondsLeft = useSecondsUntil(reauth.expiresAt)

	return (
		<div className="flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
			<span className="inline-flex items-center gap-1.5">
				<LockOpen className="h-4 w-4" />
				<T k="security.gate.unlocked">ปลดล็อกอยู่ ล็อกอัตโนมัติใน</T>{" "}
				{formatCountdown(secondsLeft)}
			</span>
			<button type="button" onClick={clearReauth} className="link">
				<T k="security.gate.lock">ล็อกตอนนี้</T>
			</button>
		</div>
	)
}
