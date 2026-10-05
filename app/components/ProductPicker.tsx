"use client"

import { KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Search } from "lucide-react";
import clsx from "clsx";
import { T } from "@/app/i18n/T";
import { formatAmount } from "@/app/lib/format";
import { productImageUrl, TProductSummary } from "@/app/lib/products";
import { fetchServiceJson } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";

type TProductPickerProps = {
	// Products already chosen: they are left out of the suggestions.
	selectedIds: string[]
	onSelect: (product: TProductSummary) => void
}
type TProductPicker = (props: TProductPickerProps) => ReactNode
type THandleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => void
type TChoose = (product: TProductSummary) => void
type THandleClickOutside = (event: MouseEvent) => void

const SEARCH_DELAY_MS = 750

type THandleChange = (value: string) => void
type TClearTimer = () => void
type TSearchResult = { items: TProductSummary[] }

// A search box that suggests the user's own products. Nothing is fetched on focus or while the box
// is empty: the search text is only handed to the query SEARCH_DELAY_MS after the last keystroke.
// Typing again restarts the wait, and a request still running for the old text is aborted by the
// query. Picking a product hands it to the parent and clears the box.
export const ProductPicker: TProductPicker = ({ selectedIds, onSelect }) => {
	const listId = useId()
	const containerRef = useRef<HTMLDivElement>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [query, setQuery] = useState("")
	const [searchText, setSearchText] = useState("")
	const [open, setOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(0)

	const search = useQuery({
		queryKey: queryKeys.products.search(searchText, selectedIds),
		queryFn: ({ signal }) => {
			const params = new URLSearchParams({ q: searchText, exclude: selectedIds.join(",") })
			return fetchServiceJson<TSearchResult>(`/products/search?${params}`, signal)
		},
		enabled: searchText !== "",
	})
	const results = search.data?.items ?? []
	const searching = searchText !== "" && search.data === undefined && !search.isError

	const clearTimer: TClearTimer = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = null
	}

	// Leaving the page must not leave a timer behind.
	useEffect(() => clearTimer, [])

	const handleChange: THandleChange = (value) => {
		setQuery(value)
		setOpen(true)
		setActiveIndex(0)
		clearTimer()

		const text = value.trim()
		if (!text) {
			setSearchText("")
			return
		}

		timerRef.current = setTimeout(() => setSearchText(text), SEARCH_DELAY_MS)
	}

	useEffect(() => {
		if (!open) return

		const handleClickOutside: THandleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false)
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [open])

	const choose: TChoose = (product) => {
		clearTimer()
		onSelect(product)
		setQuery("")
		setSearchText("")
	}

	const handleKeyDown: THandleKeyDown = (event) => {
		if (event.key === "Escape") {
			setOpen(false)
		} else if (event.key === "ArrowDown") {
			event.preventDefault()
			setActiveIndex((current) => Math.min(current + 1, results.length - 1))
		} else if (event.key === "ArrowUp") {
			event.preventDefault()
			setActiveIndex((current) => Math.max(current - 1, 0))
		} else if (event.key === "Enter" && showList && results[activeIndex]) {
			// Enter picks the highlighted product; it must not submit the order form.
			event.preventDefault()
			choose(results[activeIndex])
		}
	}

	// Before the first search finishes there is nothing to show, so the list stays closed.
	const showList = open && searchText !== ""

	return (
		<div ref={containerRef} className="relative">
			<Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
			<input
				type="text"
				role="combobox"
				aria-expanded={showList}
				aria-controls={listId}
				aria-autocomplete="list"
				aria-activedescendant={
					showList && results[activeIndex] ? `${listId}-${activeIndex}` : undefined
				}
				autoComplete="off"
				value={query}
				onChange={(event) => handleChange(event.target.value)}
				onFocus={() => setOpen(true)}
				onKeyDown={handleKeyDown}
				className="input pl-9"
			/>

			{showList && (
				<ul
					id={listId}
					role="listbox"
					className="popover absolute z-10 mt-1 max-h-72 w-full overflow-y-auto py-1"
				>
					{searching ? (
						<li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="orders.create.searching">กำลังค้นหา...</T>
						</li>
					) : results.length === 0 ? (
						<li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="orders.create.noResults">ไม่พบสินค้า</T>
						</li>
					) : (
						results.map((product, index) => (
							<li
								key={product.id}
								id={`${listId}-${index}`}
								role="option"
								aria-selected={index === activeIndex}
							>
								<button
									type="button"
									disabled={product.stock < 1}
									onClick={() => choose(product)}
									onMouseEnter={() => setActiveIndex(index)}
									className={clsx(
										"flex w-full items-center gap-3 px-3 py-2 text-left text-sm disabled:opacity-50",
										index === activeIndex && "bg-zinc-100 dark:bg-zinc-800",
									)}
								>
									<ProductThumb product={product} />
									<span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
										{product.name}
									</span>
									<span className="shrink-0 text-right text-zinc-500 dark:text-zinc-400">
										{formatAmount(Number(product.price), "THB")}
										<span className="block text-xs">
											{product.stock < 1 ? (
												<T k="orders.create.outOfStock">สินค้าหมด</T>
											) : (
												<>
													<T k="orders.create.inStock">คงเหลือ</T>{" "}
													{product.stock}
												</>
											)}
										</span>
									</span>
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}

type TProductThumbProps = { product: TProductSummary }
type TProductThumb = (props: TProductThumbProps) => ReactNode

const ProductThumb: TProductThumb = ({ product }) => {
	return (
		<span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
			{product.imageId ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={productImageUrl(product.id, product.imageId)}
					alt=""
					className="h-full w-full object-cover"
				/>
			) : (
				<ImageOff className="h-4 w-4 text-zinc-400" />
			)}
		</span>
	)
}
