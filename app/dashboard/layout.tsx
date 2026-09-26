"use client"

import { useState } from "react";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";
import { Search, Bell, Menu, X } from "lucide-react";
import clsx from "clsx";
import Navbar from "../components/main-layout/Navbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const [mobileNavOpen, setMobileNavOpen] = useState(false)

	return (
		<div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
			{mobileNavOpen && (
				<button
					aria-label="Close menu"
					onClick={() => setMobileNavOpen(false)}
					className="fixed inset-0 z-20 bg-black/30 md:hidden"
				/>
			)}

			<aside
				className={clsx(
					`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0`,
					mobileNavOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-16 items-center justify-between gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-sm font-bold text-white">
							G
						</div>
						<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
							Getzure
						</span>
					</div>
					<button
						aria-label="Close menu"
						onClick={() => setMobileNavOpen(false)}
						className="text-zinc-400 md:hidden"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<Navbar />

				<div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
					<div className="flex items-center gap-3 rounded-md p-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
							JD
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
								Jane Doe
							</p>
							<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
								jane@getzure.com
							</p>
						</div>
					</div>
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
					<button
						aria-label="Open menu"
						onClick={() => setMobileNavOpen(true)}
						className="text-zinc-500 md:hidden"
					>
						<Menu className="h-5 w-5" />
					</button>
					<div className="ml-auto flex items-center gap-3">
						<div className="hidden items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 sm:flex">
							<Search className="h-4 w-4" />
							<span>
								<T k="header.search" />
							</span>
						</div>
						<LanguageToggle />
						<ThemeToggle />
						<button
							aria-label="Notifications"
							className="relative rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						>
							<Bell className="h-5 w-5" />
							<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
						</button>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
							JD
						</div>
					</div>
				</header>

				<main className="flex-1 p-4 sm:p-6">{children}</main>
			</div>
		</div>
	)
}

export default DashboardLayout
