"use client"

import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Skeleton } from "@/app/components/Skeleton";
import { AvatarContent } from "@/app/components/AvatarContent";
import { VerifiedMark } from "@/app/components/VerifiedMark";
import { fetchServiceJson } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";

export type TSidebarUserInfo = { kyc: boolean; is_official: boolean } | null
export type TSidebarUser = { name: string; email: string; userInfo: TSidebarUserInfo }

type TSidebarUserProps = {
	// undefined while loading, null when the session came back empty.
	user: TSidebarUser | null | undefined
	failed: boolean
	onRetry: () => void
	onSignOut: () => void
}
type TSidebarUserView = (props: TSidebarUserProps) => ReactNode
type TProfileImage = { imageVersion?: string }
type TGetInitials = (name?: string | null) => string

const getInitials: TGetInitials = (name) => {
	if (!name) return "?"
	const words = name.split(" ").filter(Boolean)
	if (words.length > 1) {
		return words
			.slice(0, 2)
			.map((word) => word[0])
			.join("")
			.toUpperCase()
	}
	return name.slice(0, 2).toUpperCase()
}

// The name and e-mail at the bottom of the sidebar: a skeleton while loading, a message if it failed.
export const SidebarUser: TSidebarUserView = ({ user, failed, onRetry, onSignOut }) => {
	// Shared with the profile page, so changing the photo there updates this one too.
	const profile = useQuery({
		queryKey: queryKeys.profile,
		queryFn: ({ signal }) => fetchServiceJson<TProfileImage>("/profile", signal),
	})

	return (
		<div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
			<div className="flex items-center gap-3 rounded-md p-2">
				{failed ? (
					<div className="min-w-0 flex-1 text-xs text-zinc-500 dark:text-zinc-400">
						<T k="header.userFailed">โหลดข้อมูลผู้ใช้ไม่สำเร็จ</T>{" "}
						<button type="button" onClick={onRetry} className="link">
							<T k="query.retry">ลองใหม่</T>
						</button>
					</div>
				) : user === undefined || user === null ? (
					<>
						<Skeleton className="h-9 w-9 shrink-0 rounded-full" />
						<div className="min-w-0 flex-1 space-y-2" aria-busy="true">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-3 w-36" />
						</div>
					</>
				) : (
					<>
						<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
							<AvatarContent
								key={profile.data?.imageVersion}
								imageVersion={profile.data?.imageVersion}
								initial={getInitials(user.name)}
							/>
						</div>
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
								<span className="truncate">{user.name}</span>
								<VerifiedMark
									verified={!!user.userInfo?.kyc}
									official={!!user.userInfo?.is_official}
									placement="top"
									className="[&>svg]:h-4 [&>svg]:w-4"
								/>
							</p>
							<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
								{user.email}
							</p>
						</div>
					</>
				)}
				<button
					type="button"
					aria-label="Sign out"
					onClick={onSignOut}
					className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
				>
					<LogOut className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
