"use client"

import { useState } from "react";
import Link from "next/link";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Check, Copy, CircleCheck } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Select } from "@/app/components/Select";
import { FormField } from "@/app/components/FormField";
import { PageHeader } from "@/app/components/PageHeader";
import { DatePicker } from "@/app/components/DatePicker";
import { formatAmount } from "@/app/lib/format";
import copy from "@/app/lib/copy";
import { NumericFormat } from "react-number-format";

const CURRENCY_OPTIONS = [
	{ value: "THB", label: "THB" },
	{ value: "USD", label: "USD" },
]

type Currency = "THB" | "USD"

type FormValues = {
	title: string
	amount: number
	currency: Currency
	description?: string
	expiresAt?: string
	customerEmail?: string
}

type TGeneratePaymentLink = (title: string) => string

const generatePaymentLink: TGeneratePaymentLink = (title) => {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
	const id = Math.random().toString(36).slice(2, 8)
	return `https://pay.getzure.com/${slug || "link"}-${id}`
}

const CreatePaymentLinkPage = () => {
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			currency: "THB",
		},
	})

	const [createdLink, setCreatedLink] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	const values = useWatch({ control })

	const onSubmit: SubmitHandler<FormValues> = (data) =>
		setCreatedLink(generatePaymentLink(data.title))

	const handleCopy = () => {
		if (!createdLink) return
		copy(createdLink)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const handleReset = () => {
		setCreatedLink(null)
		setCopied(false)
		reset()
	}

	const formattedAmount = formatAmount(values.amount || 0, values.currency || "THB")

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<Link
				href="/dashboard"
				className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
			>
				<ArrowLeft className="h-4 w-4" />
				<T k="paymentLink.back">กลับไปที่การชำระเงิน</T>
			</Link>

			<PageHeader
				title={<T k="paymentLink.title">สร้างลิงก์ชำระเงิน</T>}
				subtitle={
					<T k="paymentLink.subtitle">สร้างลิงก์เพื่อส่งให้ลูกค้าใช้ชำระเงินให้คุณ</T>
				}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
				<div className="card lg:col-span-3">
					{createdLink ? (
						<div className="flex flex-col items-center py-6 text-center">
							<CircleCheck className="h-10 w-10 text-emerald-500" />
							<h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
								<T k="paymentLink.success.title">สร้างลิงก์ชำระเงินสำเร็จ</T>
							</h2>
							<div className="mt-4 flex w-full max-w-sm items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
								<span className="flex-1 truncate text-left text-sm text-zinc-700 dark:text-zinc-300">
									{createdLink}
								</span>
								<button
									type="button"
									onClick={handleCopy}
									className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10"
								>
									{copied ? (
										<>
											<Check className="h-3.5 w-3.5" />
											<T k="paymentLink.success.copied">คัดลอกแล้ว</T>
										</>
									) : (
										<>
											<Copy className="h-3.5 w-3.5" />
											<T k="paymentLink.success.copy">คัดลอก</T>
										</>
									)}
								</button>
							</div>
							<button
								type="button"
								onClick={handleReset}
								className="link mt-6 text-sm"
							>
								<T k="paymentLink.form.reset">สร้างลิงก์อีกครั้ง</T>
							</button>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
							<FormField
								label={<T k="paymentLink.form.title">ชื่อรายการชำระเงิน</T>}
								error={
									errors.title && (
										<T k="paymentLink.form.error.required">
											กรุณากรอกข้อมูลนี้
										</T>
									)
								}
							>
								<input
									{...register("title", { required: true })}
									aria-invalid={!!errors.title}
									className="input"
								/>
							</FormField>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
								<FormField
									label={<T k="paymentLink.form.amount">จำนวนเงิน</T>}
									error={
										errors.amount &&
										(errors.amount.type === "min" ? (
											<T k="paymentLink.form.error.minAmount">
												จำนวนเงินต้องมากกว่า 0
											</T>
										) : (
											<T k="paymentLink.form.error.required">
												กรุณากรอกข้อมูลนี้
											</T>
										))
									}
								>
									<Controller
										name="amount"
										control={control}
										render={({ field }) => (
											<NumericFormat
												thousandSeparator=","
												decimalScale={0}
												allowNegative={false}
												allowLeadingZeros={false}
												value={field.value}
												onValueChange={(values) =>
													field.onChange(values.value)
												}
												onBlur={field.onBlur}
												aria-invalid={!!errors.amount}
												className="input"
											/>
										)}
									/>
								</FormField>
								<FormField label={<T k="paymentLink.form.currency">สกุลเงิน</T>}>
									<Controller
										name="currency"
										control={control}
										render={({ field }) => (
											<Select
												value={field.value}
												onChange={field.onChange}
												options={CURRENCY_OPTIONS}
												className="sm:w-28"
											/>
										)}
									/>
								</FormField>
							</div>

							<FormField
								label={
									<T k="paymentLink.form.descriptionOptional">
										รายละเอียด (ไม่บังคับ)
									</T>
								}
							>
								<textarea
									rows={3}
									{...register("description")}
									className="input resize-none"
								/>
							</FormField>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField
									label={
										<T k="paymentLink.form.expiresAt">วันหมดอายุ (ไม่บังคับ)</T>
									}
								>
									<Controller
										name="expiresAt"
										control={control}
										render={({ field }) => (
											<DatePicker
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										)}
									/>
								</FormField>
								<FormField
									label={
										<T k="paymentLink.form.customerEmail">
											อีเมลลูกค้า (ไม่บังคับ)
										</T>
									}
									error={
										errors.customerEmail && (
											<T k="paymentLink.form.error.invalidEmail">
												กรุณากรอกอีเมลที่ถูกต้อง
											</T>
										)
									}
									hint={
										<T k="paymentLink.form.customerEmailHint">
											เราจะส่งลิงก์ไปยังอีเมลนี้
										</T>
									}
								>
									<input
										type="email"
										{...register("customerEmail", {
											pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
										})}
										aria-invalid={!!errors.customerEmail}
										className="input"
									/>
								</FormField>
							</div>

							<div className="flex justify-end pt-2">
								<button type="submit" className="btn-primary">
									<T k="paymentLink.form.submit">สร้างลิงก์ชำระเงิน</T>
								</button>
							</div>
						</form>
					)}
				</div>

				<div className="lg:col-span-2">
					<p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
						<T k="paymentLink.preview.label">ตัวอย่าง</T>
					</p>
					<div className="card">
						<div className="flex items-center gap-2">
							<div className="logo-mark h-7 w-7 text-xs">G</div>
							<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
								Getzure
							</span>
						</div>

						<p className="mt-6 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
							{formattedAmount}
						</p>
						<p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{values.title || (
								<T k="paymentLink.preview.untitled">ยังไม่มีชื่อรายการ</T>
							)}
						</p>
						{values.description && (
							<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
								{values.description}
							</p>
						)}

						<button
							type="button"
							disabled
							className="btn-primary mt-6 w-full cursor-default opacity-90"
						>
							<T k="paymentLink.preview.payButton">ชำระเงินตอนนี้</T>
						</button>
					</div>
					<p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
						<T k="paymentLink.preview.hint">นี่คือสิ่งที่ลูกค้าของคุณจะเห็น</T>
					</p>
				</div>
			</div>
		</div>
	)
}

export default CreatePaymentLinkPage
