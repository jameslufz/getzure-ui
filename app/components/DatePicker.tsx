"use client"

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
	{ en: "January", th: "มกราคม" },
	{ en: "February", th: "กุมภาพันธ์" },
	{ en: "March", th: "มีนาคม" },
	{ en: "April", th: "เมษายน" },
	{ en: "May", th: "พฤษภาคม" },
	{ en: "June", th: "มิถุนายน" },
	{ en: "July", th: "กรกฎาคม" },
	{ en: "August", th: "สิงหาคม" },
	{ en: "September", th: "กันยายน" },
	{ en: "October", th: "ตุลาคม" },
	{ en: "November", th: "พฤศจิกายน" },
	{ en: "December", th: "ธันวาคม" },
]

const WEEKDAYS = [
	{ en: "Su", th: "อา" },
	{ en: "Mo", th: "จ" },
	{ en: "Tu", th: "อ" },
	{ en: "We", th: "พ" },
	{ en: "Th", th: "พฤ" },
	{ en: "Fr", th: "ศ" },
	{ en: "Sa", th: "ส" },
]

const Bi = ({ en, th }: { en: string; th: string }) => {
	return (
		<>
			<span className="th:hidden">{en}</span>
			<span className="hidden th:inline">{th}</span>
		</>
	)
}

const toISODate = (date: Date) => {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

const fromISODate = (value: string): Date | null => {
	if (!value) return null
	const [y, m, d] = value.split("-").map(Number)
	if (!y || !m || !d) return null
	return new Date(y, m - 1, d)
}

const isSameDay = (a: Date, b: Date) => {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

const getMonthGrid = (viewDate: Date) => {
	const year = viewDate.getFullYear()
	const month = viewDate.getMonth()
	const startWeekday = new Date(year, month, 1).getDay()
	const daysInMonth = new Date(year, month + 1, 0).getDate()

	const cells: { date: Date; inMonth: boolean }[] = []
	for (let i = startWeekday - 1; i >= 0; i--) {
		cells.push({ date: new Date(year, month, -i), inMonth: false })
	}
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push({ date: new Date(year, month, d), inMonth: true })
	}
	while (cells.length < 42) {
		const last = cells[cells.length - 1].date
		cells.push({
			date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
			inMonth: false,
		})
	}
	return cells
}

export const DatePicker = ({
	value,
	onChange,
	className,
}: {
	value: string
	onChange: (value: string) => void
	className?: string
}) => {
	const [open, setOpen] = useState(false)
	const [placement, setPlacement] = useState<"top" | "bottom">("bottom")
	const selected = fromISODate(value)
	const [viewDate, setViewDate] = useState(() => selected ?? new Date())
	const ref = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const today = new Date()

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

	const openPicker = () => {
		setViewDate(selected ?? new Date())

		const trigger = triggerRef.current
		if (trigger) {
			const rect = trigger.getBoundingClientRect()
			const estimatedPanelHeight = 360
			const spaceBelow = window.innerHeight - rect.bottom
			const spaceAbove = rect.top
			setPlacement(
				spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow ? "top" : "bottom",
			)
		}

		setOpen(true)
	}

	const month = MONTHS[viewDate.getMonth()]

	return (
		<div ref={ref} className={`relative ${className ?? ""}`}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => (open ? setOpen(false) : openPicker())}
				aria-haspopup="dialog"
				aria-expanded={open}
				className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
			>
				{selected ? (
					<span>
						{selected.getDate()} <Bi {...MONTHS[selected.getMonth()]} />{" "}
						{selected.getFullYear()}
					</span>
				) : (
					<span className="text-zinc-400">
						<Bi en="Select date" th="เลือกวันที่" />
					</span>
				)}
				<Calendar className="h-4 w-4 text-zinc-400" />
			</button>

			{open && (
				<div
					className={`absolute z-10 w-72 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 ${
						placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
					}`}
				>
					<div className="flex items-center justify-between">
						<button
							type="button"
							aria-label="Previous month"
							onClick={() =>
								setViewDate(
									new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
								)
							}
							className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
							<Bi {...month} /> {viewDate.getFullYear()}
						</span>
						<button
							type="button"
							aria-label="Next month"
							onClick={() =>
								setViewDate(
									new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
								)
							}
							className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>

					<div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
						{WEEKDAYS.map((weekday) => (
							<span key={weekday.en}>
								<Bi {...weekday} />
							</span>
						))}
					</div>

					<div className="mt-1 grid grid-cols-7 gap-1">
						{getMonthGrid(viewDate).map(({ date, inMonth }) => {
							const isSelected = !!selected && isSameDay(date, selected)
							const isToday = isSameDay(date, today)
							return (
								<button
									key={date.toISOString()}
									type="button"
									disabled={!inMonth}
									onClick={() => {
										onChange(toISODate(date))
										setOpen(false)
									}}
									className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
										!inMonth
											? "cursor-default text-zinc-300 dark:text-zinc-700"
											: isSelected
												? "bg-teal-600 font-medium text-white"
												: isToday
													? "font-medium text-teal-600 ring-1 ring-teal-500/40 dark:text-teal-400"
													: "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
									}`}
								>
									{date.getDate()}
								</button>
							)
						})}
					</div>

					<div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
						<button
							type="button"
							onClick={() => {
								onChange("")
								setOpen(false)
							}}
							className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Bi en="Clear" th="ล้าง" />
						</button>
						<button
							type="button"
							onClick={() => {
								onChange(toISODate(today))
								setOpen(false)
							}}
							className="text-sm font-medium text-teal-600 dark:text-teal-400"
						>
							<Bi en="Today" th="วันนี้" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
