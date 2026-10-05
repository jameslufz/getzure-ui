import { ReactNode } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TPaginationProps = {
	page: number
	lastPage: number
	onChange: (page: number) => void
}
type TPagination = (props: TPaginationProps) => ReactNode
type TPageItem = number | "gap"
type TGetPageItems = (page: number, lastPage: number) => TPageItem[]

// First and last page, the current one and its neighbours; the rest collapses into "...".
const getPageItems: TGetPageItems = (page, lastPage) => {
	const wanted = new Set([1, lastPage, page - 1, page, page + 1])
	const pages = [...wanted].filter((item) => item >= 1 && item <= lastPage).sort((a, b) => a - b)

	const items: TPageItem[] = []
	pages.forEach((item, index) => {
		if (index > 0 && item - pages[index - 1] > 1) items.push("gap")
		items.push(item)
	})
	return items
}

export const Pagination: TPagination = ({ page, lastPage, onChange }) => {
	const arrow = "btn-outline px-2.5 disabled:opacity-40"

	return (
		<nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onChange(page - 1)}
				aria-label="Previous page"
				className={arrow}
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			{getPageItems(page, lastPage).map((item, index) =>
				item === "gap" ? (
					<span key={`gap-${index}`} className="px-1 text-zinc-400">
						…
					</span>
				) : (
					<button
						key={item}
						type="button"
						onClick={() => onChange(item)}
						aria-current={item === page ? "page" : undefined}
						className={clsx(
							"h-9 min-w-9 rounded-md px-2 text-sm",
							item === page
								? "bg-teal-600 font-medium text-white"
								: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
						)}
					>
						{item}
					</button>
				),
			)}

			<button
				type="button"
				disabled={page >= lastPage}
				onClick={() => onChange(page + 1)}
				aria-label="Next page"
				className={arrow}
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</nav>
	)
}
