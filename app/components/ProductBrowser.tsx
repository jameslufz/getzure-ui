"use client"

import { ReactNode, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import clsx from "clsx";
import { ImageOff, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Modal } from "@/app/components/Modal";
import { Pagination } from "@/app/components/Pagination";
import { Skeleton } from "@/app/components/Skeleton";
import { QueryNotice } from "@/app/components/QueryNotice";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { formatAmount } from "@/app/lib/format";
import { categoryHref, productImageUrl } from "@/app/lib/products";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { serviceFetch } from "@/app/lib/session";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/i18n/useLanguage";

type TProduct = {
	id: string
	name: string
	category: {
		id: number
		parentId: number
		nameTh: string
		nameEn: string
		parentNameTh: string
		parentNameEn: string
	}
	price: string
	stock: number
	createdAt: string
	images: { id: string }[]
}
type TProductPage = { items: TProduct[]; page: number; pageSize: number; total: number }
type TView = "grid" | "list"
type TProductBrowserProps = {
	// Only the products of this sub-category; every product when left out.
	categoryId?: number
	pageSize: number
}
type TProductBrowser = (props: TProductBrowserProps) => ReactNode
type TCategoryLinksProps = { product: TProduct }
type TCategoryLinks = (props: TCategoryLinksProps) => ReactNode
type TConfirmDelete = () => Promise<void>
type TReadView = () => TView
type TSaveView = (view: TView) => void
type TSubscribeView = (onChange: () => void) => () => void
type TReadServerView = () => TView

type TProductActionsProps = { product: TProduct; onDelete: (product: TProduct) => void }
type TProductActions = (props: TProductActionsProps) => ReactNode
type TProductsTableSkeletonProps = { rows: number }
type TProductsTableSkeleton = (props: TProductsTableSkeletonProps) => ReactNode
type TProductThumbProps = { product: TProduct; className: string }
type TProductThumb = (props: TProductThumbProps) => ReactNode
type TStockBadgeProps = { stock: number }
type TStockBadge = (props: TStockBadgeProps) => ReactNode
type TViewToggleProps = { view: TView; onChange: (view: TView) => void }
type TViewToggle = (props: TViewToggleProps) => ReactNode

const VIEW_STORAGE_KEY = "products-view"
const VIEW_CHANGED_EVENT = "products-view-changed"
const LOW_STOCK = 5

// The chosen view is a per-browser convenience, so a blocked or empty storage just means "grid".
const readView: TReadView = () => {
	try {
		return localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid"
	} catch {
		return "grid"
	}
}

const saveView: TSaveView = (view) => {
	try {
		localStorage.setItem(VIEW_STORAGE_KEY, view)
	} catch {}
	// "storage" only fires in other tabs, so this tab is told by hand.
	window.dispatchEvent(new Event(VIEW_CHANGED_EVENT))
}

const subscribeView: TSubscribeView = (onChange) => {
	window.addEventListener(VIEW_CHANGED_EVENT, onChange)
	window.addEventListener("storage", onChange)
	return () => {
		window.removeEventListener(VIEW_CHANGED_EVENT, onChange)
		window.removeEventListener("storage", onChange)
	}
}

// The server has no storage, so it (and the first render in the browser) starts from "grid".
const readServerView: TReadServerView = () => "grid"

type TTableView = () => ReactNode

const ProductsTableHead: TTableView = () => {
	return (
		<thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
			<tr>
				<th className="w-16 px-4 py-3 font-medium" />
				<th className="px-4 py-3 font-medium">
					<T k="products.list.colName">สินค้า</T>
				</th>
				<th className="px-4 py-3 font-medium">
					<T k="products.list.colCategory">หมวดหมู่</T>
				</th>
				<th className="px-4 py-3 text-right font-medium">
					<T k="products.list.colPrice">ราคา</T>
				</th>
				<th className="px-4 py-3 font-medium">
					<T k="products.list.colStock">สต็อก</T>
				</th>
				<th className="px-4 py-3 font-medium">
					<T k="products.list.colCreated">สร้างเมื่อ</T>
				</th>
				<th className="w-24 px-4 py-3" />
			</tr>
		</thead>
	)
}

// Rows shaped like the real ones: a picture, the text columns, a stock badge and two actions.
const ProductsTableSkeleton: TProductsTableSkeleton = ({ rows }) => {
	return (
		<div className="card overflow-x-auto p-0" aria-busy="true">
			<table className="w-full text-sm">
				<ProductsTableHead />
				<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
					{Array.from({ length: rows }, (_, row) => (
						<tr key={row}>
							<td className="px-4 py-2">
								<Skeleton className="h-10 w-10 rounded-md" />
							</td>
							<td className="px-4 py-2">
								<Skeleton className="h-4 w-40" />
							</td>
							<td className="px-4 py-2">
								<Skeleton className="h-4 w-56" />
							</td>
							<td className="px-4 py-2">
								<Skeleton className="ml-auto h-4 w-24" />
							</td>
							<td className="px-4 py-2">
								<Skeleton className="h-5 w-20 rounded-full" />
							</td>
							<td className="px-4 py-2">
								<Skeleton className="h-4 w-20" />
							</td>
							<td className="px-4 py-2">
								<div className="flex gap-1">
									<Skeleton className="h-8 w-8 rounded-md" />
									<Skeleton className="h-8 w-8 rounded-md" />
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

const ProductThumb: TProductThumb = ({ product, className }) => {
	return (
		<div
			className={clsx(
				"flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-800",
				className,
			)}
		>
			{product.images.length > 0 ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={productImageUrl(product.id, product.images[0].id)}
					alt={product.name}
					className="h-full w-full object-cover"
				/>
			) : (
				<ImageOff className="h-5 w-5 text-zinc-400" />
			)}
		</div>
	)
}

const StockBadge: TStockBadge = ({ stock }) => {
	if (stock < 1) {
		return (
			<span className="badge-danger">
				<T k="products.list.soldOut">สินค้าหมด</T>
			</span>
		)
	}

	return (
		<span className={stock <= LOW_STOCK ? "badge-warning" : "badge-success"}>
			<T k="products.list.stock">คงเหลือ</T> {stock.toLocaleString()}
		</span>
	)
}

const ProductActions: TProductActions = ({ product, onDelete }) => {
	return (
		<div className="flex items-center gap-1">
			<Link
				href={`/dashboard/products/${product.id}/edit`}
				aria-label="Edit"
				title="Edit"
				className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-teal-600 dark:hover:bg-zinc-800"
			>
				<Pencil className="h-4 w-4" />
			</Link>
			<button
				type="button"
				onClick={() => onDelete(product)}
				aria-label="Delete"
				title="Delete"
				className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
			>
				<Trash2 className="h-4 w-4" />
			</button>
		</div>
	)
}

const ViewToggle: TViewToggle = ({ view, onChange }) => {
	const options = [
		{ value: "grid", icon: LayoutGrid, label: "Grid" },
		{ value: "list", icon: List, label: "List" },
	] as const

	return (
		<div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					aria-label={option.label}
					aria-pressed={view === option.value}
					className={clsx(
						"rounded p-1.5",
						view === option.value
							? "bg-teal-600 text-white"
							: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
					)}
				>
					<option.icon className="h-4 w-4" />
				</button>
			))}
		</div>
	)
}

// The group and the sub-category as two links, each opening its own category page.
const CategoryLinks: TCategoryLinks = ({ product }) => {
	const lang = useLanguage()
	const { category } = product
	const linkClass = "hover:text-teal-600 hover:underline dark:hover:text-teal-400"

	return (
		<>
			<Link href={categoryHref(category.parentId)} className={linkClass}>
				{lang === "th" ? category.parentNameTh : category.parentNameEn}
			</Link>
			{" › "}
			<Link href={categoryHref(category.id)} className={linkClass}>
				{lang === "th" ? category.nameTh : category.nameEn}
			</Link>
		</>
	)
}

// Cards or a table of the user's products with paging and delete. The inventory page shows all
// of them and a category page shows one sub-category, in the same way.
export const ProductBrowser: TProductBrowser = ({ categoryId, pageSize }) => {
	const view = useSyncExternalStore(subscribeView, readView, readServerView)
	const [page, setPage] = useState(1)
	const [deleting, setDeleting] = useState<TProduct | null>(null)
	const { afterProductChange } = useInvalidate()

	const query = useQuery({
		queryKey: queryKeys.products.list({ page, pageSize, categoryId }),
		queryFn: ({ signal }) =>
			fetchServiceJson<TProductPage>(
				`/products?page=${page}&pageSize=${pageSize}${categoryId ? `&categoryId=${categoryId}` : ""}`,
				signal,
			),
	})
	const { data } = query
	const queryView = getQueryView(query)

	const deleteMutation = useMutation({
		mutationFn: async (productId: string) => {
			const res = await serviceFetch(`/products/${productId}`, { method: "DELETE" })
			// 404 means it is already gone, which is what was wanted.
			if (!res.ok && res.status !== 404) throw new Error("delete failed")
		},
		onSuccess: afterProductChange,
	})
	const isDeleting = deleteMutation.isPending

	const confirmDelete: TConfirmDelete = async () => {
		if (!deleting) return

		try {
			await deleteMutation.mutateAsync(deleting.id)
			showToast(<T k="products.list.deleted">ลบสินค้าแล้ว</T>)
			setDeleting(null)
			// Deleting the last card of the last page would leave an empty page behind.
			if (data && data.items.length === 1 && page > 1) setPage(page - 1)
		} catch {
			showToast(<T k="products.list.deleteFailed">ลบสินค้าไม่สำเร็จ</T>)
		}
	}

	const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<ViewToggle view={view} onChange={saveView} />
			</div>

			{queryView === "unavailable" || queryView === "failed" ? (
				<QueryNotice kind={queryView} onRetry={() => query.refetch()} />
			) : data === undefined ? (
				view === "grid" ? (
					<ul
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
						aria-hidden="true"
					>
						{Array.from({ length: pageSize }, (_, index) => (
							<li
								key={index}
								className="card flex flex-col gap-3 overflow-hidden p-0"
							>
								<Skeleton className="aspect-4/3 rounded-none" />
								<div className="space-y-2 p-4">
									<Skeleton className="h-3 w-1/2" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-6 w-1/3" />
								</div>
							</li>
						))}
					</ul>
				) : (
					<ProductsTableSkeleton rows={pageSize} />
				)
			) : data === null || data.items.length === 0 ? (
				<div className="card text-center text-sm text-zinc-500 dark:text-zinc-400">
					<T k="products.list.empty">คุณยังไม่ได้สร้างสินค้า</T>
				</div>
			) : (
				<>
					{view === "grid" ? (
						<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{data.items.map((product) => (
								<li
									key={product.id}
									className="card flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md"
								>
									<div className="relative">
										<ProductThumb product={product} className="aspect-4/3" />
										<div className="absolute top-2 left-2">
											<StockBadge stock={product.stock} />
										</div>
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
										<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
											<CategoryLinks product={product} />
										</p>
										<p
											title={product.name}
											className="line-clamp-2 min-h-10 font-medium text-zinc-900 dark:text-zinc-50"
										>
											{product.name}
										</p>
										<p className="mt-1 text-xl font-semibold text-teal-700 dark:text-teal-400">
											{formatAmount(Number(product.price), "THB")}
										</p>
									</div>
									<div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
										<span className="text-xs text-zinc-400 dark:text-zinc-500">
											{new Date(product.createdAt).toLocaleDateString()}
										</span>
										<ProductActions product={product} onDelete={setDeleting} />
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="card overflow-x-auto p-0">
							<table className="w-full text-sm">
								<ProductsTableHead />
								<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
									{data.items.map((product) => (
										<tr key={product.id}>
											<td className="px-4 py-2">
												<ProductThumb
													product={product}
													className="h-10 w-10 rounded-md"
												/>
											</td>
											<td className="max-w-64 truncate px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">
												{product.name}
											</td>
											<td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
												<CategoryLinks product={product} />
											</td>
											<td className="px-4 py-2 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-50">
												{formatAmount(Number(product.price), "THB")}
											</td>
											<td className="px-4 py-2">
												<StockBadge stock={product.stock} />
											</td>
											<td className="px-4 py-2 whitespace-nowrap text-zinc-400 dark:text-zinc-500">
												{new Date(product.createdAt).toLocaleDateString()}
											</td>
											<td className="px-4 py-2">
												<ProductActions
													product={product}
													onDelete={setDeleting}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<Pagination page={page} lastPage={lastPage} onChange={setPage} />
				</>
			)}

			<Modal
				open={deleting !== null}
				onClose={() => !isDeleting && setDeleting(null)}
				title={<T k="products.list.deleteTitle">ลบสินค้านี้?</T>}
			>
				<div className="space-y-4">
					<p className="text-sm text-zinc-600 dark:text-zinc-300">
						<span className="font-medium">{deleting?.name}</span>
						<br />
						<T k="products.list.deleteBody">
							รูปภาพของสินค้าจะถูกลบด้วย
							ออเดอร์ที่สร้างไปแล้วจะยังคงเก็บข้อมูลสินค้าเดิมไว้
						</T>
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={() => setDeleting(null)}
							disabled={isDeleting}
							className="btn-outline"
						>
							<T k="products.list.cancel">ยกเลิก</T>
						</button>
						<button
							type="button"
							onClick={confirmDelete}
							disabled={isDeleting}
							className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
						>
							<T k="products.list.deleteConfirm">ลบสินค้า</T>
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
