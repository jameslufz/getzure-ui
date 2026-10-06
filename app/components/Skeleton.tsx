import { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

type TSkeletonProps = { className?: string; style?: CSSProperties }
type TSkeleton = (props: TSkeletonProps) => ReactNode

// A grey placeholder shape; it is visible on the white cards too, unlike a pulsing white block.
export const Skeleton: TSkeleton = ({ className }) => {
	return (
		<div
			aria-hidden="true"
			className={clsx("animate-pulse rounded bg-zinc-200 dark:bg-zinc-700", className)}
		/>
	)
}
