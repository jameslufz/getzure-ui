"use client"

import { FormEventHandler, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Check, CircleCheck, Copy, ImageOff, PackagePlus, Trash2 } from "lucide-react";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { ImageUploader } from "@/app/components/ImageUploader";
import { Modal } from "@/app/components/Modal";
import { Breadcrumb, PAYMENT_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { QuantityInput } from "@/app/components/QuantityInput";
import { ProductForm } from "@/app/components/ProductForm";
import { ProductPicker } from "@/app/components/ProductPicker";
import {
	appendPayer,
	EMPTY_PAYER,
	hasPayerError,
	PayerFields,
	TPayer,
	validatePayer,
} from "@/app/components/PayerFields"
import copy from "@/app/lib/copy";
import { guestOrderLink } from "@/app/lib/guest-order";
import { breakDownSatang, toSatang } from "@/app/lib/fee";
import { formatAmount } from "@/app/lib/format";
import { productImageUrl, TProductSummary } from "@/app/lib/products";
import { serviceFetch } from "@/app/lib/session";
import { showToast } from "@/app/lib/toast";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import {
	ORDER_EXPIRY_MINUTES,
	ORDER_IMAGE_MAX_BYTES,
	ORDER_IMAGE_MAX_COUNT,
	ORDER_MAX_PRODUCTS,
	PRODUCT_IMAGE_EXTENSIONS,
	PRODUCT_IMAGE_MIME_TYPES,
	SHOW_VAT_TO_CREATOR,
} from "@/app/lib/validation"

type TOrderLine = { product: TProductSummary; quantity: number }
type TItemsProblem = "none" | "tooMany"
type TAddItem = (product: TProductSummary) => void
type TSetQuantity = (productId: string, quantity: number) => void
type THandleQuickAdded = (product: TProductSummary) => void
type TCreateOrderPage = () => React.ReactNode
type TCreatedOrder = { id: string; guestKey?: string }
type TCreateOrder = (formData: FormData) => Promise<TCreatedOrder>
type TLineSatang = (line: TOrderLine) => number

// Works in satang (whole numbers), so adding prices never gives 0.1 + 0.2 style results.
const lineSatang: TLineSatang = (line) => (toSatang(line.product.price) ?? 0) * line.quantity

const createOrder: TCreateOrder = async (formData) => {
	// No Content-Type header: the browser adds the multipart boundary itself.
	const res = await serviceFetch("/orders", { method: "POST", body: formData })
	if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
	return res.json()
}

const CreateOrderPage: TCreateOrderPage = () => {
	const { afterOrderCreated } = useInvalidate()
	const createMutation = useMutation({ mutationFn: createOrder, onSuccess: afterOrderCreated })
	const [items, setItems] = useState<TOrderLine[]>([])
	const [itemsProblem, setItemsProblem] = useState<TItemsProblem>("none")
	const [showEmptyError, setShowEmptyError] = useState(false)
	const [showNoImageError, setShowNoImageError] = useState(false)
	const [quickAddOpen, setQuickAddOpen] = useState(false)
	const [files, setFiles] = useState<File[]>([])
	const [payer, setPayer] = useState<TPayer>(EMPTY_PAYER)
	const [payerTried, setPayerTried] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const submitting = createMutation.isPending
	const [createdId, setCreatedId] = useState<string | null>(null)
	const [guestKey, setGuestKey] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	const totalSatang = items.reduce((sum, line) => sum + lineSatang(line), 0)
	const summary = breakDownSatang(totalSatang)

	const addItem: TAddItem = (product) => {
		if (product.stock < 1) return
		if (items.some((line) => line.product.id === product.id)) return
		if (items.length >= ORDER_MAX_PRODUCTS) return setItemsProblem("tooMany")

		setItemsProblem("none")
		setShowEmptyError(false)
		setItems([...items, { product, quantity: 1 }])
	}

	// The quantity can't pass the stock; the server checks it again.
	const setQuantity: TSetQuantity = (productId, quantity) => {
		setItems(
			items.map((line) =>
				line.product.id === productId
					? { ...line, quantity: Math.min(Math.max(quantity, 1), line.product.stock) }
					: line,
			),
		)
	}

	const handleQuickAdded: THandleQuickAdded = (product) => {
		addItem(product)
		setQuickAddOpen(false)
		showToast(<T k="products.create.done">เพิ่มสินค้าแล้ว</T>)
	}

	const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault()
		setServerError(null)

		if (items.length === 0) setShowEmptyError(true)
		if (files.length === 0) setShowNoImageError(true)

		setPayerTried(true)
		if (items.length === 0 || files.length === 0 || hasPayerError(validatePayer(payer))) return

		// Only which products, how many, and who: the server works out prices, total and expiry.
		const formData = new FormData()
		items.forEach((line) => formData.append("items", `${line.product.id}:${line.quantity}`))
		appendPayer(formData, payer)
		files.forEach((file) => formData.append("images", file))

		try {
			const created = await createMutation.mutateAsync(formData)
			setCreatedId(created.id)
			setGuestKey(created.guestKey ?? null)
			showToast(<T k="orders.create.done">สร้างออเดอร์แล้ว</T>)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	const handleReset = () => {
		setItems([])
		setFiles([])
		setPayer(EMPTY_PAYER)
		setPayerTried(false)
		setCreatedId(null)
		setShowNoImageError(false)
		setGuestKey(null)
		setCopied(false)
		setServerError(null)
	}

	const origin = createdId ? window.location.origin : ""
	const orderLink = !createdId
		? ""
		: guestKey
			? guestOrderLink(origin, createdId, guestKey)
			: `${origin}/dashboard/orders/${createdId}`

	const handleCopy = () => {
		copy(orderLink)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Breadcrumb
				items={[PAYMENT_CRUMB, { label: <T k="nav.createOrder">สร้างออเดอร์</T> }]}
			/>

			<PageHeader
				title={<T k="orders.create.title">สร้างออเดอร์</T>}
				subtitle={<T k="orders.create.subtitle">เลือกสินค้าและจำนวน แล้วระบุผู้ชำระ</T>}
			/>

			{createdId ? (
				<div className="card flex flex-col items-center py-8 text-center">
					<CircleCheck className="h-10 w-10 text-emerald-500" />
					<h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
						<T k="orders.create.linkTitle">สร้างออเดอร์สำเร็จ</T>
					</h2>
					<div className="mt-4 flex w-full max-w-md items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
						<span className="flex-1 truncate text-left text-sm text-zinc-700 dark:text-zinc-300">
							{orderLink}
						</span>
						<button
							type="button"
							onClick={handleCopy}
							className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10"
						>
							{copied ? (
								<>
									<Check className="h-3.5 w-3.5" />
									<T k="orders.create.copied">คัดลอกแล้ว</T>
								</>
							) : (
								<>
									<Copy className="h-3.5 w-3.5" />
									<T k="orders.create.copy">คัดลอก</T>
								</>
							)}
						</button>
					</div>
					{guestKey && (
						<p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="orders.create.guestLinkNote">
								ส่งลิงก์นี้ให้ผู้ชำระที่เป็นแขก เปิดได้โดยไม่ต้องเข้าสู่ระบบ
							</T>
						</p>
					)}
					<div className="mt-6 flex items-center gap-4 text-sm">
						<Link href={`/dashboard/orders/${createdId}`} className="link">
							<T k="orders.create.view">ดูออเดอร์</T>
						</Link>
						<button type="button" onClick={handleReset} className="link">
							<T k="orders.create.another">สร้างออเดอร์อีกครั้ง</T>
						</button>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="card space-y-6" noValidate>
					{serverError && (
						<p className="alert-error">
							<T k={SERVER_ERROR_MESSAGES[serverError].key}>
								{SERVER_ERROR_MESSAGES[serverError].th}
							</T>
						</p>
					)}

					<FormField
						required
						label={<T k="orders.create.products">สินค้า</T>}
						hint={
							<T k="orders.create.productsHint">
								ค้นหาสินค้าของคุณแล้วเลือกได้หลายรายการ
							</T>
						}
						error={
							showEmptyError ? (
								<T k="orders.create.errorProducts">
									กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ
								</T>
							) : itemsProblem === "tooMany" ? (
								<T k="orders.create.errorTooManyProducts">
									ออเดอร์มีสินค้าได้สูงสุด 20 รายการ
								</T>
							) : null
						}
					>
						<div className="flex flex-col gap-3 sm:flex-row">
							<div className="flex-1">
								<ProductPicker
									selectedIds={items.map((line) => line.product.id)}
									onSelect={addItem}
								/>
							</div>
							<button
								type="button"
								onClick={() => setQuickAddOpen(true)}
								className="btn-outline whitespace-nowrap"
							>
								<PackagePlus className="h-4 w-4" />
								<T k="orders.create.quickAdd">เพิ่มสินค้า</T>
							</button>
						</div>
					</FormField>

					<div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
						<table className="w-full text-sm">
							<thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
								<tr>
									<th className="w-20 px-3 py-2 font-medium">
										<T k="orders.create.colImage">รูป</T>
									</th>
									<th className="px-3 py-2 font-medium">
										<T k="orders.create.colName">สินค้า</T>
									</th>
									<th className="px-3 py-2 text-right font-medium">
										<T k="orders.create.colPrice">ราคา</T>
									</th>
									<th className="w-40 px-3 py-2 text-center font-medium">
										<T k="orders.create.colQuantity">จำนวน</T>
									</th>
									<th className="px-3 py-2 text-right font-medium">
										<T k="orders.create.colLineTotal">รวม</T>
									</th>
									<th className="w-12 px-3 py-2" />
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
								{items.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400"
										>
											<T k="orders.create.empty">ยังไม่ได้เพิ่มสินค้า</T>
										</td>
									</tr>
								) : (
									items.map(({ product, quantity }) => (
										<tr key={product.id}>
											<td className="px-3 py-2">
												<span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
													{product.imageId ? (
														// eslint-disable-next-line @next/next/no-img-element
														<img
															src={productImageUrl(
																product.id,
																product.imageId,
															)}
															alt=""
															className="h-full w-full object-cover"
														/>
													) : (
														<ImageOff className="h-4 w-4 text-zinc-400" />
													)}
												</span>
											</td>
											<td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
												{product.name}
												<span className="block text-xs font-normal text-zinc-400">
													<T k="orders.create.inStock">คงเหลือ</T>{" "}
													{product.stock}
												</span>
											</td>
											<td className="px-3 py-2 text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300">
												{formatAmount(Number(product.price), "THB")}
											</td>
											<td className="px-3 py-2">
												<QuantityInput
													label="Quantity"
													value={String(quantity)}
													onChange={(next) =>
														setQuantity(product.id, Number(next) || 1)
													}
													min={1}
													max={product.stock}
												/>
											</td>
											<td className="px-3 py-2 text-right font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-50">
												{formatAmount(
													lineSatang({ product, quantity }) / 100,
													"THB",
												)}
											</td>
											<td className="px-3 py-2 text-right">
												<button
													type="button"
													onClick={() =>
														setItems(
															items.filter(
																(line) =>
																	line.product.id !== product.id,
															),
														)
													}
													aria-label="Remove"
													className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-zinc-800"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{items.length > 0 && (
						<dl className="rounded-md bg-zinc-50 p-4 text-sm dark:bg-zinc-800/50">
							<div className="flex justify-between">
								<dt className="text-zinc-600 dark:text-zinc-300">
									<T k="orders.create.summaryPay">ยอดชำระสุทธิ</T>
								</dt>
								<dd className="text-zinc-900 dark:text-zinc-50">
									{formatAmount(summary.price, "THB")}
								</dd>
							</div>
							<div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
								<div className="flex justify-between">
									<dt className="text-zinc-500 dark:text-zinc-400">
										<T k="orders.create.summaryFee">ค่าธรรมเนียม</T>
									</dt>
									<dd className="text-zinc-500 dark:text-zinc-400">
										− {formatAmount(summary.fee, "THB")}
									</dd>
								</div>
								{SHOW_VAT_TO_CREATOR && (
									<div className="flex justify-between text-xs">
										<dt className="text-zinc-400 dark:text-zinc-500">
											<T k="orders.create.summaryVat">
												VAT 7% ที่รวมอยู่ในค่าธรรมเนียม
											</T>
										</dt>
										<dd className="text-zinc-500 dark:text-zinc-400">
											{formatAmount(summary.vat, "THB")}
										</dd>
									</div>
								)}
								<div className="flex items-baseline justify-between">
									<dt className="font-medium text-zinc-900 dark:text-zinc-50">
										<T k="orders.create.summaryReceive">
											ยอดที่คุณจะได้รับสุทธิ
										</T>
									</dt>
									<dd className="text-xl font-semibold text-teal-700 dark:text-teal-400">
										{formatAmount(summary.net, "THB")}
									</dd>
								</div>
							</div>
						</dl>
					)}

					<FormField
						required
						label={<T k="orders.create.readyImages">ภาพสินค้าที่พร้อมส่ง</T>}
						error={
							showNoImageError && files.length === 0 ? (
								<T k="orders.create.errorImages">
									กรุณาเพิ่มภาพสินค้าที่พร้อมส่งอย่างน้อย 1 รูป
								</T>
							) : null
						}
					>
						<ImageUploader
							files={files}
							onChange={setFiles}
							maxCount={ORDER_IMAGE_MAX_COUNT}
							maxBytes={ORDER_IMAGE_MAX_BYTES}
							extensions={PRODUCT_IMAGE_EXTENSIONS}
							mimeTypes={PRODUCT_IMAGE_MIME_TYPES}
						/>
					</FormField>

					<PayerFields
						payer={payer}
						onChange={setPayer}
						errors={payerTried ? validatePayer(payer) : null}
					/>

					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						<T k="orders.create.expiryNote">ลิงก์ออเดอร์หมดอายุใน</T>{" "}
						{ORDER_EXPIRY_MINUTES} <T k="orders.create.minutes">นาที</T>
					</p>

					<button type="submit" disabled={submitting} className="btn-primary w-full">
						<T k="orders.create.submit">สร้างออเดอร์</T>
					</button>
				</form>
			)}

			{/* Outside the <form>: a Modal's events reach the component that renders it, so inside the
			    form, saving the product would also submit the order. */}
			<Modal
				open={quickAddOpen}
				onClose={() => setQuickAddOpen(false)}
				title={<T k="orders.create.quickAddTitle">เพิ่มสินค้า</T>}
			>
				<ProductForm onSaved={handleQuickAdded} />
			</Modal>
		</div>
	)
}

export default CreateOrderPage
