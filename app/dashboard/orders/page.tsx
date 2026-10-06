"use client"

import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Breadcrumb, PAYMENT_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { Pagination } from "@/app/components/Pagination";
import { Skeleton } from "@/app/components/Skeleton";
import { QueryNotice } from "@/app/components/QueryNotice";
import { Select } from "@/app/components/Select";
import { formatAmount } from "@/app/lib/format";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { ORDER_PAGE_SIZES } from "@/app/lib/validation";

type TOrderRow = {
	id: string
	total: string
	fee: string
	net: string
	itemCount: number
	customerCount: number
	payerType: "member" | "guest"
	createdAt: string
	expired: boolean
}
type TOrderPageData = { items: TOrderRow[]; page: number; pageSize: number; total: number }
type TOrdersPage = () => ReactNode
type THandlePageSizeChange = (value: string) => void

const DEFAULT_PAGE_SIZE = ORDER_PAGE_SIZES[0]
const SKELETON_ROWS = 8

const OrdersPage: TOrdersPage = () => {
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

	const query = useQuery({
		queryKey: queryKeys.orders.list({ page, pageSize }),
		queryFn: ({ signal }) =>
			fetchServiceJson<TOrderPageData>(`/orders?page=${page}&pageSize=${pageSize}`, signal),
	})
	const { data } = query
	const queryView = getQueryView(query)

	const handlePageSizeChange: THandlePageSizeChange = (value) => {
		setPage(1)
		setPageSize(Number(value))
	}

	const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
	const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
	const to = data ? Math.min(data.page * data.pageSize, data.total) : 0

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<Breadcrumb
				items={[PAYMENT_CRUMB, { label: <T k="nav.orders.list">รายการออเดอร์</T> }]}
			/>

			<div className="flex items-start justify-between gap-4">
				<PageHeader
					title={<T k="orders.list.title">รายการออเดอร์</T>}
					subtitle={<T k="orders.list.subtitle">ออเดอร์ทั้งหมดที่คุณสร้างไว้</T>}
				/>
				<Link
					href="/dashboard/orders/create"
					className="btn-primary inline-flex shrink-0 items-center gap-1.5"
				>
					<Plus className="h-4 w-4" />
					<T k="nav.createOrder">สร้างออเดอร์</T>
				</Link>
			</div>

			<div className="card overflow-x-auto p-0">
				<table className="w-full text-sm">
					<thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
						<tr>
							<th className="px-4 py-3 font-medium">
								<T k="orders.list.colNo">ออเดอร์</T>
							</th>
							<th className="px-4 py-3 text-right font-medium">
								<T k="orders.list.colItems">สินค้า</T>
							</th>
							<th className="px-4 py-3 font-medium">
								<T k="orders.list.colPayer">ผู้ชำระ</T>
							</th>
							<th className="px-4 py-3 text-right font-medium">
								<T k="orders.list.colTotal">ยอดรวม</T>
							</th>
							<th className="px-4 py-3 text-right font-medium">
								<T k="orders.list.colFee">ค่าธรรมเนียม</T>
							</th>
							<th className="px-4 py-3 text-right font-medium">
								<T k="orders.list.colNet">ยอดที่ได้รับ</T>
							</th>
							<th className="px-4 py-3 font-medium">
								<T k="orders.list.colStatus">สถานะ</T>
							</th>
							<th className="px-4 py-3 font-medium">
								<T k="orders.list.colCreated">สร้างเมื่อ</T>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
						{queryView === "loading" || data === undefined ? (
							Array.from({ length: SKELETON_ROWS }, (_, index) => (
								<tr key={index}>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-20" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="ml-auto h-4 w-6" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-20" />
									</td>
									{[28, 24, 28].map((width, cell) => (
										<td key={cell} className="px-4 py-3">
											<Skeleton
												className="ml-auto h-4"
												style={{ width: width * 4 }}
											/>
										</td>
									))}
									<td className="px-4 py-3">
										<Skeleton className="h-5 w-16 rounded-full" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-36" />
									</td>
								</tr>
							))
						) : queryView === "unavailable" ||
						  queryView === "failed" ||
						  data === null ? (
							<tr>
								<td colSpan={8} className="px-4 py-6">
									<QueryNotice
										kind={queryView === "failed" ? "failed" : "unavailable"}
										onRetry={() => query.refetch()}
									/>
								</td>
							</tr>
						) : data.items.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
								>
									<T k="orders.list.empty">คุณยังไม่ได้สร้างออเดอร์</T>
								</td>
							</tr>
						) : (
							data.items.map((order) => (
								<tr key={order.id}>
									<td className="px-4 py-3 font-mono">
										<Link
											href={`/dashboard/orders/${order.id}`}
											className="link"
										>
											{order.id.slice(0, 8)}
										</Link>
									</td>
									<td className="px-4 py-3 text-right">{order.itemCount}</td>
									<td className="px-4 py-3">
										{order.payerType === "guest" ? (
											<T k="orders.list.payerGuest">แขก</T>
										) : (
											<>
												<T k="orders.list.payerMember">สมาชิก</T> (
												{order.customerCount})
											</>
										)}
									</td>
									<td className="px-4 py-3 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-50">
										{formatAmount(Number(order.total), "THB")}
									</td>
									<td className="px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400">
										{formatAmount(Number(order.fee), "THB")}
									</td>
									<td className="px-4 py-3 text-right whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-50">
										{formatAmount(Number(order.net), "THB")}
									</td>
									<td className="px-4 py-3">
										{order.expired ? (
											<span className="badge-danger">
												<T k="orders.list.expired">หมดอายุ</T>
											</span>
										) : (
											<span className="badge-success">
												<T k="orders.list.open">เปิดอยู่</T>
											</span>
										)}
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-zinc-400 dark:text-zinc-500">
										{new Date(order.createdAt).toLocaleString()}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
					<span className="flex items-center gap-2">
						<T k="orders.list.perPage">แสดงต่อหน้า</T>
						<Select
							className="w-24"
							value={String(pageSize)}
							onChange={handlePageSizeChange}
							options={ORDER_PAGE_SIZES.map((size) => ({
								value: String(size),
								label: String(size),
							}))}
						/>
					</span>
					{data && data.total > 0 && (
						<span>
							{from}–{to} <T k="orders.list.range">จาก</T> {data.total}
						</span>
					)}
				</div>
				<Pagination page={page} lastPage={lastPage} onChange={setPage} />
			</div>
		</div>
	)
}

export default OrdersPage
