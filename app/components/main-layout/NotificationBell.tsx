"use client"

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Bell, IdCard, KeyRound, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { T } from "@/app/i18n/T";
import { QueryNotice } from "@/app/components/QueryNotice";
import { Skeleton } from "@/app/components/Skeleton";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { QueryHttpError } from "@/app/lib/query-client";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { serviceFetch } from "@/app/lib/session";

type TNotificationType = "verify_identity" | "verify_pending" | "set_password" | "security_low"
type TNotificationRow = {
	id: string
	type: TNotificationType
	createdAt: string
	readAt: string | null
}
type TNotificationList = { items: TNotificationRow[]; unreadCount: number }
type TNoticeView = { icon: LucideIcon; title: ReactNode; body: ReactNode; href: string }
type TNotificationBell = () => ReactNode
type TMarkRead = (id: string | null) => Promise<void>
type THandleClickOutside = (event: MouseEvent) => void

// The text and the page to open for each kind of reminder; the server only stores the kind.
const NOTICE_VIEWS: Record<TNotificationType, TNoticeView> = {
	verify_identity: {
		icon: IdCard,
		title: <T k="notify.verify.title">ยังไม่ได้ยืนยันตัวตน</T>,
		body: <T k="notify.verify.body">ยืนยันตัวตนเพื่อใช้งานได้เต็มรูปแบบ</T>,
		href: "/dashboard/verification",
	},
	verify_pending: {
		icon: IdCard,
		title: <T k="notify.pending.title">กำลังรอตรวจสอบ</T>,
		body: <T k="notify.pending.body">เราได้รับข้อมูลยืนยันตัวตนของคุณแล้ว</T>,
		href: "/dashboard/verification",
	},
	set_password: {
		icon: KeyRound,
		title: <T k="notify.password.title">ยังไม่ได้ตั้งรหัสผ่าน</T>,
		body: (
			<T k="notify.password.body">ตั้งรหัสผ่านเพื่อใช้เข้าสู่ระบบและเปิดความปลอดภัยสองชั้น</T>
		),
		href: "/dashboard/security/change-password",
	},
	security_low: {
		icon: ShieldCheck,
		title: <T k="notify.security.title">ระดับความปลอดภัยต่ำ</T>,
		body: <T k="notify.security.body">เปิดความปลอดภัยสองชั้นเพื่อปกป้องบัญชีของคุณ</T>,
		href: "/dashboard/security/two-factor",
	},
}

// One id marks that reminder read; null marks them all.
const markRead: TMarkRead = async (id) => {
	const res = await serviceFetch(id ? `/notifications/${id}/read` : "/notifications/read-all", {
		method: "POST",
	})
	if (!res.ok) throw new QueryHttpError(res.status)
}

export const NotificationBell: TNotificationBell = () => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [open, setOpen] = useState(false)
	const { afterNotificationRead } = useInvalidate()
	const query = useQuery({
		queryKey: queryKeys.notifications,
		queryFn: ({ signal }) => fetchServiceJson<TNotificationList>("/notifications", signal),
	})
	const readMutation = useMutation({ mutationFn: markRead, onSuccess: afterNotificationRead })
	const list = query.data
	const queryView = getQueryView(query)
	const unread = list?.unreadCount ?? 0

	useEffect(() => {
		if (!open) return

		const handleClickOutside: THandleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node))
				setOpen(false)
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [open])

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label="Notifications"
				aria-expanded={open}
				onClick={() => setOpen(!open)}
				className="relative rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				<Bell className="h-5 w-5" />
				{unread > 0 && (
					<span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
						{unread}
					</span>
				)}
			</button>

			{open && (
				<div className="popover absolute right-0 z-30 mt-1 w-80 max-w-[calc(100vw-2rem)] overflow-hidden">
					<div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
						<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
							<T k="header.notifications">การแจ้งเตือน</T>
						</p>
						{unread > 0 && (
							<button
								type="button"
								disabled={readMutation.isPending}
								onClick={() => readMutation.mutate(null)}
								className="link text-xs"
							>
								<T k="header.notificationsReadAll">อ่านทั้งหมดแล้ว</T>
							</button>
						)}
					</div>
					{list === undefined && queryView === "loading" ? (
						<div className="space-y-3 p-4" aria-busy="true">
							{[0, 1].map((row) => (
								<div key={row} className="flex gap-3">
									<Skeleton className="h-8 w-8 shrink-0 rounded-md" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-3 w-full" />
									</div>
								</div>
							))}
						</div>
					) : queryView === "failed" || queryView === "unavailable" ? (
						<QueryNotice kind={queryView} onRetry={() => query.refetch()} />
					) : list === undefined || list === null || list.items.length === 0 ? (
						<p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
							<T k="header.notificationsEmpty">ไม่มีการแจ้งเตือน</T>
						</p>
					) : (
						<ul className="max-h-96 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-700">
							{list.items.map((item) => {
								const view = NOTICE_VIEWS[item.type]
								return (
									<li key={item.id}>
										<Link
											href={view.href}
											onClick={() => {
												setOpen(false)
												if (!item.readAt) readMutation.mutate(item.id)
											}}
											className={clsx(
												"flex gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800",
												item.readAt && "opacity-60",
											)}
										>
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
												<view.icon className="h-4 w-4" />
											</span>
											<span className="min-w-0 flex-1">
												<span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
													{view.title}
												</span>
												<span className="block text-xs text-zinc-500 dark:text-zinc-400">
													{view.body}
												</span>
												<span className="mt-0.5 block text-[11px] text-zinc-400">
													{new Date(item.createdAt).toLocaleDateString()}
												</span>
											</span>
											{!item.readAt && (
												<span
													className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500"
													aria-label="Unread"
												/>
											)}
										</Link>
									</li>
								)
							})}
						</ul>
					)}
				</div>
			)}
		</div>
	)
}
