"use client"

import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
	const toggle = () => {
		const next = !document.documentElement.classList.contains("dark")
		document.documentElement.classList.toggle("dark", next)
		localStorage.setItem("theme", next ? "dark" : "light")
	}

	return (
		<button
			type="button"
			aria-label="Toggle dark mode"
			onClick={toggle}
			className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-zinc-300 transition-colors dark:bg-teal-600"
		>
			<span className="flex h-4 w-4 translate-x-1 items-center justify-center rounded-full bg-white transition-transform dark:translate-x-6">
				<Sun className="h-2.5 w-2.5 text-amber-500 dark:hidden" />
				<Moon className="hidden h-2.5 w-2.5 text-teal-600 dark:block" />
			</span>
		</button>
	)
}
