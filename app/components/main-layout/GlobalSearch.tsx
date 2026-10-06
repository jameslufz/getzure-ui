"use client"

import { ChangeEvent, KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Search } from "lucide-react";
import { T } from "@/app/i18n/T";
import { translations } from "@/app/i18n/translations";
import { useLanguage } from "@/app/i18n/useLanguage";
import { NavItem, searchPages } from "@/app/lib/nav-groups";

type TGlobalSearch = () => ReactNode
type TMatchesPage = (page: NavItem, text: string) => boolean
type TGoTo = (page: NavItem) => void
type THandleChange = (event: ChangeEvent<HTMLInputElement>) => void
type THandleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => void
type THandleClickOutside = (event: MouseEvent) => void

const MAX_RESULTS = 8

// A page matches when the text is part of its Thai name, its English name or its address.
const matchesPage: TMatchesPage = (page, text) => {
	const wanted = text.trim().toLowerCase()
	if (!wanted) return true

	return [page.th, translations[page.key], page.href].some((name) =>
		name.toLowerCase().includes(wanted),
	)
}

// Finds the pages of the app by name and opens the chosen one. Empty text lists every page.
export const GlobalSearch: TGlobalSearch = () => {
	const router = useRouter()
	const lang = useLanguage()
	const listId = useId()
	const containerRef = useRef<HTMLDivElement>(null)
	const [text, setText] = useState("")
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)

	const results = searchPages.filter((page) => matchesPage(page, text)).slice(0, MAX_RESULTS)

	useEffect(() => {
		if (!open) return

		const handleClickOutside: THandleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node))
				setOpen(false)
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [open])

	const goTo: TGoTo = (page) => {
		setText("")
		setOpen(false)
		router.push(page.href)
	}

	const handleChange: THandleChange = (event) => {
		setText(event.target.value)
		setActive(0)
		setOpen(true)
	}

	const handleKeyDown: THandleKeyDown = (event) => {
		if (event.key === "Escape") {
			setOpen(false)
		} else if (event.key === "ArrowDown") {
			event.preventDefault()
			setOpen(true)
			setActive((current) => Math.min(current + 1, results.length - 1))
		} else if (event.key === "ArrowUp") {
			event.preventDefault()
			setActive((current) => Math.max(current - 1, 0))
		} else if (event.key === "Enter" && open && results[active]) {
			event.preventDefault()
			goTo(results[active])
		}
	}

	return (
		<div ref={containerRef} className="relative hidden sm:block">
			<Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
			<input
				type="text"
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				aria-autocomplete="list"
				aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
				autoComplete="off"
				value={text}
				placeholder={lang === "th" ? "ค้นหา..." : translations["header.search"]}
				onChange={handleChange}
				onFocus={() => setOpen(true)}
				onKeyDown={handleKeyDown}
				className="w-56 rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
			/>

			{open && (
				<ul
					id={listId}
					role="listbox"
					className="popover absolute right-0 z-30 mt-1 w-72 py-1"
				>
					{results.length === 0 ? (
						<li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="header.searchEmpty">ไม่พบหน้าที่ตรงกัน</T>
						</li>
					) : (
						results.map((page, index) => (
							<li
								key={page.href}
								id={`${listId}-${index}`}
								role="option"
								aria-selected={index === active}
							>
								<button
									type="button"
									onClick={() => goTo(page)}
									onMouseEnter={() => setActive(index)}
									className={clsx(
										"flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200",
										index === active && "bg-zinc-100 dark:bg-zinc-800",
									)}
								>
									<page.icon className="h-4 w-4 shrink-0 text-zinc-400" />
									<T k={page.key}>{page.th}</T>
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}
