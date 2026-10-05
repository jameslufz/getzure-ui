"use client"

import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string }

type TSelectProps = {
	value: string
	onChange: (value: string) => void
	options: Option[]
	className?: string
	placeholder?: ReactNode
	invalid?: boolean
	disabled?: boolean
}

type TSelect = (props: TSelectProps) => ReactNode
type THandleClickOutside = (event: MouseEvent) => void
type THandleKeyDown = (event: KeyboardEvent) => void

export const Select: TSelect = ({
	value,
	onChange,
	options,
	className,
	placeholder,
	invalid,
	disabled,
}) => {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return

		const handleClickOutside: THandleClickOutside = (event) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false)
			}
		}
		const handleKeyDown: THandleKeyDown = (event) => {
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
				data-invalid={invalid}
				disabled={disabled}
				className="input flex items-center justify-between gap-2 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{selected ? selected.label : <span className="text-zinc-400">{placeholder}</span>}
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
					className="popover absolute z-10 mt-1 max-h-64 w-full overflow-y-auto py-1"
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
