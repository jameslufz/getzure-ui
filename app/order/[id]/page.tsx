"use client"

import { ReactNode, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Clock, ImageOff, ShieldX } from "lucide-react";
import { T } from "@/app/i18n/T";
import { PageHeader } from "@/app/components/PageHeader";
import { formatAmount } from "@/app/lib/format";
import { guestFetch } from "@/app/lib/guest-order";
import { QueryHttpError } from "@/app/lib/query-client";
import { getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { formatCountdown, useSecondsUntil } from "@/app/lib/otp-session";

type TGuestItem = {
	productId: string | null
	name: string
	price: string
	quantity: number
	imageId: string | null
}
type TGuestOrder = {
	id: string
	currency: "THB"
	total: string
	secondsRemaining: number
	items: TGuestItem[]
	images: { id: string }[]
}
type TLoaded = { order: TGuestOrder; key: string; endsAt: number }
type TFetchGuestOrder = (id: string, signal?: AbortSignal) => Promise<TLoaded | null>
type TFetchGuestImage = (path: string, key: string, signal?: AbortSignal) => Promise<Blob | null>
type TGuestOrderPage = () => ReactNode
type TGuestImageProps = { path: string; orderKey: string; className: string }
type TGuestImage = (props: TGuestImageProps) => ReactNode
type TCountdownProps = { endsAt: number }
type TCountdown = (props: TCountdownProps) => ReactNode

const FORBIDDEN_STATUS = 403

// The key sits in the link's fragment, is never part of a cache key, and every guest answer is asked fresh.
const fetchGuestOrder: TFetchGuestOrder = async (id, signal) => {
	const key = window.location.hash.slice(1)
	if (!key) return null

	const res = await guestFetch(`/${id}`, key, signal)
	if (res.status === FORBIDDEN_STATUS) return null
	if (!res.ok) throw new QueryHttpError(res.status)

	const order: TGuestOrder = await res.json()
	return { order, key, endsAt: Date.now() + order.secondsRemaining * 1000 }
}

const fetchGuestImage: TFetchGuestImage = async (path, key, signal) => {
	const res = await guestFetch(path, key, signal)
	return res.ok ? res.blob() : null
}

// Images need the key header, which an <img> can't send, so they are fetched as blobs.
const GuestImage: TGuestImage = ({ path, orderKey, className }) => {
	const image = useQuery({
		queryKey: queryKeys.guestImage(path),
		queryFn: ({ signal }) => fetchGuestImage(path, orderKey, signal),
		staleTime: 0,
		gcTime: 0,
	})
	const src = useMemo(() => (image.data ? URL.createObjectURL(image.data) : null), [image.data])
	useEffect(() => () => (src ? URL.revokeObjectURL(src) : undefined), [src])

	// eslint-disable-next-line @next/next/no-img-element
	if (src) return <img src={src} alt="" className={className} />
	return <ImageOff className="h-5 w-5 text-zinc-400" />
}

const Countdown: TCountdown = ({ endsAt }) => {
	const secondsLeft = useSecondsUntil(endsAt)

	return (
		<span className="inline-flex items-center gap-1.5">
			<Clock className="h-4 w-4" />
			{secondsLeft > 0 ? (
				<>
					<T k="orders.view.expiresIn">ลิงก์ปิดใน</T> {formatCountdown(secondsLeft)}
				</>
			) : (
				<T k="orders.view.expired">ออเดอร์นี้หมดอายุแล้ว</T>
			)}
		</span>
	)
}

const GuestOrderPage: TGuestOrderPage = () => {
	const { id } = useParams<{ id: string }>()
	const query = useQuery({
		queryKey: queryKeys.guestOrder(id),
		queryFn: ({ signal }) => fetchGuestOrder(id, signal),
		staleTime: 0,
		gcTime: 0,
	})
	const loaded = query.data
	const queryView = getQueryView(query)

	const order = loaded?.order

	return (
		<main className="mx-auto w-full max-w-xl space-y-6 p-4 py-10">
			<PageHeader
				title={<T k="guestOrder.title">ออเดอร์</T>}
				subtitle={<T k="guestOrder.subtitle">ตรวจสอบรายการสินค้าและยอดรวม</T>}
			/>

			{loaded === undefined && queryView === "loading" && (
				<div className="card h-40 animate-pulse" />
			)}

			{(loaded === null || queryView === "failed") && (
				<div className="card flex flex-col items-center py-8 text-center">
					<ShieldX className="h-10 w-10 text-rose-500" />
					<p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
						{loaded === null ? (
							<T k="guestOrder.invalid">ลิงก์นี้ไม่ถูกต้อง</T>
						) : (
							<T k="guestOrder.failed">โหลดออเดอร์ไม่สำเร็จ กรุณาลองใหม่ภายหลัง</T>
						)}
					</p>
				</div>
			)}

			{loaded !== undefined && loaded !== null && order && (
				<>
					<div className="card space-y-4">
						<div className="text-sm text-zinc-500 dark:text-zinc-400">
							<Countdown endsAt={loaded.endsAt} />
						</div>

						<ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
							{order.items.map((item, index) => (
								<li
									key={`${item.productId ?? "removed"}-${index}`}
									className="flex items-center gap-3 py-3"
								>
									<span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
										{item.productId && item.imageId ? (
											<GuestImage
												path={`/${order.id}/items/${item.productId}/image`}
												orderKey={loaded.key}
												className="h-full w-full object-cover"
											/>
										) : (
											<ImageOff className="h-5 w-5 text-zinc-400" />
										)}
									</span>
									<span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
										{item.name}
										<span className="block text-xs font-normal text-zinc-400">
											{formatAmount(Number(item.price), order.currency)} ×{" "}
											{item.quantity}
										</span>
									</span>
									<span className="shrink-0 text-zinc-700 dark:text-zinc-300">
										{formatAmount(
											(Math.round(Number(item.price) * 100) * item.quantity) /
												100,
											order.currency,
										)}
									</span>
								</li>
							))}
						</ul>

						<div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
							<span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
								<T k="guestOrder.total">ยอดรวม</T>
							</span>
							<span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
								{formatAmount(Number(order.total), order.currency)}
							</span>
						</div>
					</div>

					{order.images.length > 0 && (
						<div className="card space-y-3">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="guestOrder.photos">ภาพสินค้าที่พร้อมส่ง</T>
							</h2>
							<ul className="grid grid-cols-3 gap-3">
								{order.images.map((image) => (
									<li
										key={image.id}
										className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
									>
										<GuestImage
											path={`/${order.id}/images/${image.id}`}
											orderKey={loaded.key}
											className="h-full w-full object-cover"
										/>
									</li>
								))}
							</ul>
						</div>
					)}
				</>
			)}
		</main>
	)
}

export default GuestOrderPage
