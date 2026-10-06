"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { authClient } from "@/app/lib/auth-client";
import { clearClientSession, handleSessionExpired } from "@/app/lib/session";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import Navbar from "../components/main-layout/Navbar";
import { GlobalSearch } from "@/app/components/main-layout/GlobalSearch";
import { NotificationBell } from "@/app/components/main-layout/NotificationBell";
import { SidebarUser, TSidebarUser } from "@/app/components/main-layout/SidebarUser";

// What customSession in auth.ts adds to the user.
type TSessionUserInfo = { kyc: boolean; is_official: boolean } | null
type TSessionUser = { userInfo?: TSessionUserInfo }
type TDashboardLayoutProps = { children: React.ReactNode }
type TDashboardLayout = (props: TDashboardLayoutProps) => React.ReactNode

const DashboardLayout: TDashboardLayout = ({ children }) => {
	const router = useRouter()
	const [mobileNavOpen, setMobileNavOpen] = useState(false)
	const { data: session, isPending, error, refetch } = authClient.useSession()
	const sessionUser = session && session.user
	const user: TSidebarUser | null | undefined = isPending
		? undefined
		: sessionUser
			? {
					name: sessionUser.name,
					email: sessionUser.email,
					userInfo: (sessionUser as TSessionUser).userInfo ?? null,
				}
			: null

	// "No session and no error" is the server saying the session is gone (an error is just a
	// failed request). It also fires when the tab regains focus, because useSession refetches.
	useEffect(() => {
		if (!isPending && !error && !session) handleSessionExpired()
	}, [isPending, error, session])

	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					clearClientSession()
					router.push("/sign-in")
				},
			},
		})
	}

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
					`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-900 md:sticky md:top-0 md:h-dvh md:shrink-0 md:translate-x-0`,
					mobileNavOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
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

				<SidebarUser
					user={user}
					failed={!!error}
					onRetry={() => refetch()}
					onSignOut={handleSignOut}
				/>
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
						<GlobalSearch />
						<LanguageToggle />
						<ThemeToggle />
						<NotificationBell />
					</div>
				</header>

				<main className="flex-1 p-4 sm:p-6">{children}</main>
			</div>
		</div>
	)
}

export default DashboardLayout
