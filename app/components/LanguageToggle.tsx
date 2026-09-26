"use client"

import { Languages } from "lucide-react";

export const LanguageToggle = () => {
	const toggle = () => {
		const next = document.documentElement.lang === "th" ? "en" : "th"
		document.documentElement.lang = next
		localStorage.setItem("lang", next)
	}

	return (
		<button
			type="button"
			aria-label="Switch language"
			onClick={toggle}
			className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
		>
			<Languages className="h-4 w-4" />
			<span className="th:hidden">EN</span>
			<span className="hidden th:inline">TH</span>
		</button>
	)
}
