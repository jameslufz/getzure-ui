"use client"

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Clock, ImageOff, ShieldX } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Breadcrumb, PAYMENT_CRUMB, TCrumb } from "@/app/components/Breadcrumb";
import { OrderSkeleton } from "@/app/components/skeletons/PageSkeletons";
import { PageHeader } from "@/app/components/PageHeader";
import { BANK_LABELS } from "@/app/lib/banks";
import copy from "@/app/lib/copy";
import { guestOrderLink } from "@/app/lib/guest-order";
import { formatAmount } from "@/app/lib/format";
import { formatCountdown, useSecondsUntil } from "@/app/lib/otp-session";
import { orderImageUrl, orderItemImageUrl } from "@/app/lib/products";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";

type TOrderItem = {
	productId: string | null
	name: string
	price: string
	quantity: number
	imageId: string | null
}
type TOrderGuest = {
	phoneNumber: string
	fullNameTh: string
	bankCode: keyof typeof BANK_LABELS
	bankAccountMask: string
}
type TOrderCustomer = { type: "phone" | "email"; value: string }
type TOrder = {
	id: string
	currency: "THB"
	total: string
	// Only the creator gets these two.
	fee?: string
	net?: string
	secondsRemaining: number
	expired: boolean
	isOwner: boolean
	items: TOrderItem[]
	images: { id: string }[]
	customers?: TOrderCustomer[]
	guest?: TOrderGuest
	guestKey?: string
}
type TOrderView = TOrder & { endsAt: number }
type TFetchOrder = (id: string, signal?: AbortSignal) => Promise<TOrderView | null>
type TOrderPage = () => React.ReactNode
type TOrderCountdownProps = { endsAt: number }
type TOrderCountdown = (props: TOrderCountdownProps) => React.ReactNode

// Time left on the link, counted down on this device from the seconds the server reported, so a
// wrong clock on this device can't show the wrong time.
const OrderCountdown: TOrderCountdown = ({ endsAt }) => {
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

// The end time is worked out when the answer arrives, so a cached answer still counts down correctly.
const fetchOrder: TFetchOrder = async (id, signal) => {
	const order = await fetchServiceJson<TOrder>(`/orders/${id}`, signal)
	return order && { ...order, endsAt: Date.now() + order.secondsRemaining * 1000 }
}

// What the creator and the tagged customers see when they open the order link. Anyone else is
// told they may not, and never learns whether the order exists.
const OrderPage: TOrderPage = () => {
	const { id } = useParams<{ id: string }>()
	const query = useQuery({
		queryKey: queryKeys.orders.detail(id),
		queryFn: ({ signal }) => fetchOrder(id, signal),
	})
	const { data: order } = query
	const queryView = getQueryView(query)
	const crumbs: TCrumb[] = [
		PAYMENT_CRUMB,
		{ label: <T k="nav.orders.list">รายการออเดอร์</T>, href: "/dashboard/orders" },
		{ label: `#${id.slice(0, 8)}` },
	]

	if (order === null || queryView === "failed") {
		return (
			<div className="mx-auto max-w-3xl space-y-6">
				<Breadcrumb items={crumbs} />
				<div className="mx-auto max-w-md py-16 text-center">
					<ShieldX className="mx-auto h-12 w-12 text-rose-500" />
					<p className="mt-4 text-sm font-medium text-rose-500">403</p>
					<h1 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
						{order === null ? (
							<T k="orders.view.forbidden">คุณไม่ได้รับอนุญาตให้เข้าถึงออเดอร์</T>
						) : (
							<T k="orders.view.notFound">ไม่สามารถโหลดออเดอร์นี้ได้</T>
						)}
					</h1>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Breadcrumb items={crumbs} />

			<PageHeader
				title={<T k="orders.view.title">ออเดอร์</T>}
				subtitle={<T k="orders.view.subtitle">รายการสินค้าและยอดรวมของออเดอร์นี้</T>}
			/>

			{order === undefined ? (
				<OrderSkeleton />
			) : (
				<>
					<div className="card space-y-4">
						<div className="flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
							<OrderCountdown endsAt={order.endsAt} />
						</div>

						<ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
							{order.items.map((item, index) => (
								<li
									key={`${item.productId ?? "removed"}-${index}`}
									className="flex items-center gap-3 py-3"
								>
									<span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
										{item.productId && item.imageId ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={orderItemImageUrl(order.id, item.productId)}
												alt=""
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

						<div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									<T k="orders.view.total">ยอดรวม</T>
								</span>
								<span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
									{formatAmount(Number(order.total), order.currency)}
								</span>
							</div>
							{order.fee !== undefined && order.net !== undefined && (
								<dl className="space-y-1 rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
									<div className="flex justify-between">
										<dt className="text-zinc-500 dark:text-zinc-400">
											<T k="orders.view.fee">ค่าธรรมเนียม</T>
										</dt>
										<dd>{formatAmount(Number(order.fee), order.currency)}</dd>
									</div>
									<div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-50">
										<dt>
											<T k="orders.view.net">สุทธิ</T>
										</dt>
										<dd>{formatAmount(Number(order.net), order.currency)}</dd>
									</div>
								</dl>
							)}
						</div>
					</div>

					{order.images.length > 0 && (
						<div className="card space-y-3">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="orders.view.photos">ภาพสินค้าที่พร้อมส่ง</T>
							</h2>
							<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{order.images.map((image) => (
									<li
										key={image.id}
										className="aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={orderImageUrl(order.id, image.id)}
											alt=""
											className="h-full w-full object-cover"
										/>
									</li>
								))}
							</ul>
						</div>
					)}

					{order.isOwner && order.customers && order.customers.length > 0 && (
						<div className="card space-y-3">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="orders.view.customers">ผู้ชำระ (สมาชิก)</T>
							</h2>
							<ul className="flex flex-wrap gap-2">
								{order.customers.map((customer) => (
									<li
										key={`${customer.type}-${customer.value}`}
										className="badge-accent"
									>
										{customer.value}
									</li>
								))}
							</ul>
						</div>
					)}

					{order.isOwner && order.guestKey && (
						<div className="card space-y-3">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="orders.view.guestLink">ลิงก์สำหรับผู้ชำระที่เป็นแขก</T>
							</h2>
							<div className="flex items-center gap-2">
								<input
									readOnly
									value={guestOrderLink(
										window.location.origin,
										order.id,
										order.guestKey,
									)}
									className="input"
								/>
								<button
									type="button"
									onClick={() =>
										copy(
											guestOrderLink(
												window.location.origin,
												order.id,
												order.guestKey ?? "",
											),
										)
									}
									className="btn-outline"
								>
									<T k="orders.create.copy">คัดลอก</T>
								</button>
							</div>
						</div>
					)}

					{order.isOwner && order.guest && (
						<div className="card space-y-3">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="orders.view.guest">ผู้ชำระ (แขก)</T>
							</h2>
							<dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
								<div>
									<dt className="text-zinc-500 dark:text-zinc-400">
										<T k="orders.view.guestName">ชื่อจริง</T>
									</dt>
									<dd>{order.guest.fullNameTh}</dd>
								</div>
								<div>
									<dt className="text-zinc-500 dark:text-zinc-400">
										<T k="orders.view.guestPhone">เบอร์โทรศัพท์</T>
									</dt>
									<dd>{order.guest.phoneNumber}</dd>
								</div>
								<div>
									<dt className="text-zinc-500 dark:text-zinc-400">
										<T k="orders.view.guestBank">ธนาคาร</T>
									</dt>
									<dd>{BANK_LABELS[order.guest.bankCode]}</dd>
								</div>
								<div>
									<dt className="text-zinc-500 dark:text-zinc-400">
										<T k="orders.view.guestAccount">เลขบัญชี</T>
									</dt>
									<dd>{order.guest.bankAccountMask}</dd>
								</div>
							</dl>
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default OrderPage
