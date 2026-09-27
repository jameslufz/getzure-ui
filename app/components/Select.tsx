"use client"

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string }

export const Select = ({
	value,
	onChange,
	options,
	className,
}: {
	value: string
	onChange: (value: string) => void
	options: Option[]
	className?: string
}) => {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return

		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false)
			}
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false)
		}

		document.addEventListener("mousedown", handleClickOutside)
		document.addEventListener("keydown", handleKeyDown)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [open])

	const selected = options.find((option) => option.value === value)

	return (
		<div ref={ref} className={clsx("relative", className)}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
			>
				{selected && selected.label}
				<ChevronDown
					className={clsx(
						"h-4 w-4 text-zinc-400 transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<ul
					role="listbox"
					className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
				>
					{options.map((option) => {
						const isSelected = option.value === value
						return (
							<li key={option.value} role="option" aria-selected={isSelected}>
								<button
									type="button"
									onClick={() => {
										onChange(option.value)
										setOpen(false)
									}}
									className={clsx(
										"flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
										isSelected
											? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
											: "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
									)}
								>
									{option.label}
									{isSelected && <Check className="h-4 w-4" />}
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
