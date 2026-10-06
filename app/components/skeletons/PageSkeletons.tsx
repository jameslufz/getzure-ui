import { ReactNode } from "react";
import { Skeleton } from "@/app/components/Skeleton";

type TCountProps = { count?: number }
type TSkeletonView = () => ReactNode
type TCountSkeletonView = (props: TCountProps) => ReactNode

const range = (count: number) => Array.from({ length: count }, (_, index) => index)

// A label and a value side by side, like the rows of the profile cards.
const InfoRows: TCountSkeletonView = ({ count = 2 }) => {
	return (
		<div className="divide-y divide-zinc-200 dark:divide-zinc-700">
			{range(count).map((row) => (
				<div key={row} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-3 sm:gap-4">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-48 sm:col-span-2" />
				</div>
			))}
		</div>
	)
}

export const ProfileSkeleton: TSkeletonView = () => {
	return (
		<div className="space-y-6" aria-busy="true">
			<div className="card">
				<div className="flex items-center gap-4 pb-2">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-44" />
						<Skeleton className="h-4 w-28" />
					</div>
				</div>
				<InfoRows count={2} />
			</div>
			<div className="card">
				<div className="flex items-center justify-between pb-1">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-12" />
				</div>
				<InfoRows count={3} />
			</div>
			<div className="card">
				<div className="flex items-center justify-between pb-1">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-5 w-24 rounded-full" />
				</div>
				<InfoRows count={3} />
				<Skeleton className="mt-3 h-10 w-44 rounded-md" />
			</div>
		</div>
	)
}

// Title and description, the way every second-factor card starts.
const FactorHead: TSkeletonView = () => {
	return (
		<div className="flex items-start justify-between gap-3">
			<div className="space-y-2">
				<Skeleton className="h-5 w-56" />
				<Skeleton className="h-4 w-72 max-w-full" />
			</div>
			<Skeleton className="h-5 w-24 rounded-full" />
		</div>
	)
}

export const TwoFactorSkeleton: TSkeletonView = () => {
	return (
		<div className="space-y-6" aria-busy="true">
			<div className="card space-y-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-56" />
					<Skeleton className="h-4 w-10" />
				</div>
				<div className="flex gap-1.5">
					{range(3).map((bar) => (
						<Skeleton key={bar} className="h-2 flex-1 rounded-full" />
					))}
				</div>
				<Skeleton className="h-3 w-80 max-w-full" />
			</div>
			<div className="card space-y-4">
				<FactorHead />
				<div className="space-y-2">
					{range(4).map((option) => (
						<Skeleton key={option} className="h-14 w-full rounded-md" />
					))}
				</div>
			</div>
			{range(4).map((card) => (
				<div key={card} className="card space-y-4">
					<FactorHead />
					<Skeleton className="h-10 w-48 rounded-md" />
				</div>
			))}
		</div>
	)
}

// A card of item rows with a total under it: the order pages.
export const OrderSkeleton: TSkeletonView = () => {
	return (
		<div className="card space-y-4" aria-busy="true">
			<Skeleton className="h-4 w-40" />
			<div className="divide-y divide-zinc-200 dark:divide-zinc-700">
				{range(3).map((item) => (
					<div key={item} className="flex items-center gap-3 py-3">
						<Skeleton className="h-14 w-14 shrink-0 rounded-md" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48 max-w-full" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-4 w-20" />
					</div>
				))}
			</div>
			<div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-7 w-32" />
			</div>
		</div>
	)
}

// Labels over inputs, then a button: the shape of a form card.
export const FormSkeleton: TCountSkeletonView = ({ count = 4 }) => {
	return (
		<div className="space-y-4" aria-busy="true">
			{range(count).map((field) => (
				<div key={field} className="space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
			))}
			<Skeleton className="h-10 w-full rounded-md" />
		</div>
	)
}

export const CategorySkeleton: TSkeletonView = () => {
	return (
		<div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
			<div className="space-y-2">
				<Skeleton className="h-6 w-56" />
				<Skeleton className="h-4 w-72 max-w-full" />
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{range(6).map((tile) => (
					<div key={tile} className="card flex items-center gap-3">
						<Skeleton className="h-5 w-5 shrink-0" />
						<Skeleton className="h-4 flex-1" />
						<Skeleton className="h-5 w-8 rounded-full" />
					</div>
				))}
			</div>
		</div>
	)
}
