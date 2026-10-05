"use client"

import { ReactNode, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { T } from "@/app/i18n/T";
import { useLanguage } from "@/app/i18n/useLanguage";
import { FormField } from "@/app/components/FormField";
import { ImageUploader, TExistingImage } from "@/app/components/ImageUploader";
import { QueryNotice } from "@/app/components/QueryNotice";
import { Select } from "@/app/components/Select";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { breakDown } from "@/app/lib/fee";
import { formatAmount } from "@/app/lib/format";
import { productImageUrl, TProductSummary } from "@/app/lib/products";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { serviceFetch } from "@/app/lib/session";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import {
	PRODUCT_IMAGE_EXTENSIONS,
	PRODUCT_IMAGE_MAX_BYTES,
	PRODUCT_IMAGE_MAX_COUNT,
	PRODUCT_IMAGE_MIME_TYPES,
	PRODUCT_NAME_MAX_LENGTH,
	PRODUCT_PRICE_PATTERN,
	PRODUCT_STOCK_MAX,
	PRODUCT_TEXT_PATTERN,
} from "@/app/lib/validation"

type TProductFormProps = {
	// Set to edit that product: the form loads it first and saves with PUT instead of POST.
	productId?: string
	onSaved: (product: TProductSummary) => void
}
type TProductDetail = {
	id: string
	name: string
	price: string
	stock: number
	categoryId: number
	groupId: number
	images: { id: string }[]
}
type TProductForm = (props: TProductFormProps) => ReactNode
type TProductFormBodyProps = {
	product?: TProductDetail
	onSaved: (product: TProductSummary) => void
}
type TProductFormBody = (props: TProductFormBodyProps) => ReactNode
type TSaveProduct = (formData: FormData) => Promise<TProductSummary>
type TProductValues = {
	name: string
	categoryId: string
	price: string
	stock: string
}
type TCategory = { id: number; nameTh: string; nameEn: string; children?: TCategory[] }
type TCategoryName = (category: TCategory) => string

// Loads the product to edit (never from the cache, so an edit starts from the real stock), then shows the form.
export const ProductForm: TProductForm = ({ productId, onSaved }) => {
	const detail = useQuery({
		queryKey: queryKeys.products.detail(productId ?? ""),
		queryFn: ({ signal }) => fetchServiceJson<TProductDetail>(`/products/${productId}`, signal),
		enabled: !!productId,
		gcTime: 0,
	})
	const queryView = getQueryView(detail)

	if (!productId) return <ProductFormBody onSaved={onSaved} />
	if (queryView === "unavailable") {
		return (
			<p className="alert-error">
				<T k="products.edit.missing">ไม่พบสินค้านี้</T>
			</p>
		)
	}
	if (queryView === "failed")
		return <QueryNotice kind="failed" onRetry={() => detail.refetch()} />
	if (detail.data === undefined || detail.data === null) {
		return <div className="h-64 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
	}

	return <ProductFormBody product={detail.data} onSaved={onSaved} />
}

// The form that adds or edits a product. The add and edit pages and the quick-add dialog on the
// order form all use it, and each decides what happens once the product is saved.
const ProductFormBody: TProductFormBody = ({ product, onSaved }) => {
	const lang = useLanguage()
	const { afterProductChange } = useInvalidate()
	const [images, setImages] = useState<File[]>([])
	const [existingImages, setExistingImages] = useState<TExistingImage[]>(
		() =>
			product?.images.map((image) => ({
				id: image.id,
				url: productImageUrl(product.id, image.id),
			})) ?? [],
	)
	const [groupId, setGroupId] = useState(product ? String(product.groupId) : "")
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<TProductValues>({
		defaultValues: product
			? {
					name: product.name,
					categoryId: String(product.categoryId),
					price: product.price,
					stock: String(product.stock),
				}
			: undefined,
	})

	const categories = useQuery({
		queryKey: queryKeys.categoryTree,
		queryFn: ({ signal }) =>
			fetchServiceJson<{ items: TCategory[] }>("/product-categories", signal),
	})
	const groups = categories.data?.items ?? []

	const saveProduct: TSaveProduct = async (formData) => {
		// No Content-Type header: the browser adds the multipart boundary itself.
		const res = await serviceFetch(product ? `/products/${product.id}` : "/products", {
			method: product ? "PUT" : "POST",
			body: formData,
		})
		if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
		const saved: { product: TProductSummary } = await res.json()
		return saved.product
	}

	const saveMutation = useMutation({ mutationFn: saveProduct, onSuccess: afterProductChange })

	const categoryName: TCategoryName = (category) =>
		lang === "th" ? category.nameTh : category.nameEn
	const subCategories = groups.find((group) => String(group.id) === groupId)?.children ?? []

	const onSubmit: SubmitHandler<TProductValues> = async (data) => {
		setServerError(null)

		const formData = new FormData()
		formData.append("name", data.name.trim())
		formData.append("categoryId", data.categoryId)
		formData.append("price", data.price)
		formData.append("stock", data.stock)
		existingImages.forEach((image) => formData.append("keepImageIds", image.id))
		images.forEach((image) => formData.append("images", image))

		try {
			onSaved(await saveMutation.mutateAsync(formData))
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	const price = useWatch({ control, name: "price" })
	const feeBreakdown = breakDown(price ?? "")

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}

			<FormField
				required
				label={<T k="products.create.name">ชื่อสินค้า</T>}
				error={errors.name && <T k="products.create.error.name">กรุณากรอกชื่อสินค้า</T>}
			>
				<input
					type="text"
					maxLength={PRODUCT_NAME_MAX_LENGTH}
					{...register("name", {
						required: true,
						validate: (value) => PRODUCT_TEXT_PATTERN.test(value.trim()),
					})}
					aria-invalid={!!errors.name}
					className="input"
				/>
			</FormField>

			<FormField
				required
				label={<T k="products.create.category">หมวดหมู่สินค้า</T>}
				error={
					errors.categoryId && (
						<T k="products.create.error.category">กรุณาเลือกหมวดหมู่และหมวดหมู่ย่อย</T>
					)
				}
			>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Select
						value={groupId}
						onChange={(next) => {
							setGroupId(next)
							// The sub-category belongs to the old group, so it has to be picked again.
							setValue("categoryId", "")
						}}
						options={groups.map((group) => ({
							value: String(group.id),
							label: categoryName(group),
						}))}
						placeholder={<T k="products.create.pickGroup">เลือกหมวดหมู่</T>}
						invalid={!!errors.categoryId && !groupId}
					/>
					<Controller
						name="categoryId"
						control={control}
						rules={{ required: true }}
						render={({ field }) => (
							<Select
								value={field.value ?? ""}
								onChange={field.onChange}
								options={subCategories.map((category) => ({
									value: String(category.id),
									label: categoryName(category),
								}))}
								placeholder={<T k="products.create.pickSub">เลือกหมวดหมู่ย่อย</T>}
								invalid={!!errors.categoryId}
								disabled={!groupId}
							/>
						)}
					/>
				</div>
			</FormField>

			<FormField
				required
				label={<T k="products.create.price">ราคาสินค้า (บาท)</T>}
				error={
					errors.price && (
						<T k="products.create.error.price">
							กรุณากรอกราคามากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง
						</T>
					)
				}
			>
				<Controller
					name="price"
					control={control}
					rules={{
						required: true,
						validate: (value) => PRODUCT_PRICE_PATTERN.test(value) && Number(value) > 0,
					}}
					render={({ field }) => (
						<NumericFormat
							thousandSeparator=","
							decimalScale={2}
							allowNegative={false}
							inputMode="decimal"
							placeholder="0.00"
							value={field.value}
							onValueChange={(values) => field.onChange(values.value)}
							onBlur={field.onBlur}
							aria-invalid={!!errors.price}
							className="input"
						/>
					)}
				/>
			</FormField>

			<FormField
				required
				label={<T k="products.create.stock">จำนวนสินค้าคงคลัง</T>}
				error={
					errors.stock && (
						<T k="products.create.error.stock">กรุณากรอกจำนวนเต็มตั้งแต่ 0 ขึ้นไป</T>
					)
				}
			>
				<Controller
					name="stock"
					control={control}
					rules={{
						required: true,
						validate: (value) =>
							/^\d+$/.test(value) && Number(value) <= PRODUCT_STOCK_MAX,
					}}
					render={({ field }) => (
						<NumericFormat
							thousandSeparator=","
							decimalScale={0}
							allowNegative={false}
							inputMode="numeric"
							placeholder="0"
							value={field.value}
							onValueChange={(values) => field.onChange(values.value)}
							onBlur={field.onBlur}
							aria-invalid={!!errors.stock}
							className="input"
						/>
					)}
				/>
			</FormField>

			{feeBreakdown && (
				<dl className="space-y-1 rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
					<div className="flex justify-between">
						<dt className="text-zinc-500 dark:text-zinc-400">
							<T k="products.fee.price">ราคาสินค้า</T>
						</dt>
						<dd>{formatAmount(feeBreakdown.price, "THB")}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-zinc-500 dark:text-zinc-400">
							<T k="products.fee.fee">ค่าธรรมเนียม</T>
						</dt>
						<dd>{formatAmount(feeBreakdown.fee, "THB")}</dd>
					</div>
					<div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-50">
						<dt>
							<T k="products.fee.net">สุทธิ</T>
						</dt>
						<dd>{formatAmount(feeBreakdown.net, "THB")}</dd>
					</div>
				</dl>
			)}

			<FormField
				label={<T k="products.create.images">รูปภาพสินค้า</T>}
				hint={
					<T k="products.create.imagesHint">
						สูงสุด 5 รูป รูปละไม่เกิน 5 MB รองรับไฟล์ jpg, jpeg, png, webp, avif
					</T>
				}
			>
				<ImageUploader
					files={images}
					onChange={setImages}
					existing={existingImages}
					onExistingChange={setExistingImages}
					maxCount={PRODUCT_IMAGE_MAX_COUNT}
					maxBytes={PRODUCT_IMAGE_MAX_BYTES}
					extensions={PRODUCT_IMAGE_EXTENSIONS}
					mimeTypes={PRODUCT_IMAGE_MIME_TYPES}
				/>
			</FormField>

			<button type="submit" disabled={isSubmitting} className="btn-primary w-full">
				{product ? (
					<T k="products.edit.submit">บันทึกการแก้ไข</T>
				) : (
					<T k="products.create.submit">เพิ่มสินค้า</T>
				)}
			</button>
		</form>
	)
}
