"use client"

import { ReactNode, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldX } from "lucide-react";
import { T } from "@/app/i18n/T";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { Skeleton } from "@/app/components/Skeleton";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { guestFetch } from "@/app/lib/guest-order";
import { QueryHttpError } from "@/app/lib/query-client";
import { getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";

type TGuestOrderPage = () => ReactNode
type TCheckLink = (id: string, signal?: AbortSignal) => Promise<true | null>

const FORBIDDEN_STATUS = 403

// True when the key in the link opens this order, null when it doesn't; the key is never part of a cache key.
const checkLink: TCheckLink = async (id, signal) => {
	const key = window.location.hash.slice(1)
	if (!key) return null

	const res = await guestFetch(`/${id}`, key, signal)
	if (res.status === FORBIDDEN_STATUS) return null
	if (!res.ok) throw new QueryHttpError(res.status)
	return true
}

// The payment page of an order for a guest. A valid link only says what comes next, for now.
const GuestOrderPage: TGuestOrderPage = () => {
	const { id } = useParams<{ id: string }>()
	const [closeBlocked, setCloseBlocked] = useState(false)
	const query = useQuery({
		queryKey: queryKeys.guestOrder(id),
		queryFn: ({ signal }) => checkLink(id, signal),
		staleTime: 0,
		gcTime: 0,
	})
	const valid = query.data
	const queryView = getQueryView(query)

	// A browser only lets a page close a tab it opened itself; otherwise the person is told to.
	const handleClose = () => {
		window.close()
		setCloseBlocked(true)
	}

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col p-4">
			<div className="flex items-center justify-end gap-3 py-2">
				<LanguageToggle />
				<ThemeToggle />
			</div>

			<div className="flex flex-1 items-center justify-center pb-16">
				{valid === undefined && queryView === "loading" && (
					<div className="card w-full space-y-4" aria-busy="true">
						<Skeleton className="h-5 w-full" />
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="mx-auto h-10 w-48 rounded-md" />
					</div>
				)}

				{(valid === null || queryView === "failed") && (
					<div className="card flex w-full flex-col items-center py-8 text-center">
						<ShieldX className="h-10 w-10 text-rose-500" />
						<p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
							{valid === null ? (
								<T k="guestOrder.invalid">ลิงก์นี้ไม่ถูกต้อง</T>
							) : (
								<T k="guestOrder.failed">
									โหลดออเดอร์ไม่สำเร็จ กรุณาลองใหม่ภายหลัง
								</T>
							)}
						</p>
					</div>
				)}

				{valid === true && (
					<div className="card w-full space-y-6 text-center">
						<p className="text-base text-zinc-900 dark:text-zinc-50">
							<T k="guestOrder.notice">
								ระบบจะเปลี่ยนหน้าไปยังลิงก์ชำระเงินของ Payment Gateway
								นี่คือระบบทดสอบ
							</T>
						</p>
						<button type="button" onClick={handleClose} className="btn-primary">
							<T k="guestOrder.close">คลิกที่นี่เพื่อปิด</T>
						</button>
						{closeBlocked && (
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								<T k="guestOrder.closeBlocked">
									เบราว์เซอร์ไม่อนุญาตให้ปิดหน้านี้ กรุณาปิดแท็บเอง
								</T>
							</p>
						)}
					</div>
				)}
			</div>
		</main>
	)
}

export default GuestOrderPage
