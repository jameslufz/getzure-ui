"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Check, Copy, CircleCheck } from "lucide-react";
import { T } from "@/app/i18n/T";
import type { TranslationKey } from "@/app/i18n/translations";
import { Select } from "@/app/components/Select";

const CURRENCY_OPTIONS = [
	{ value: "THB", label: "THB" },
	{ value: "USD", label: "USD" },
];

type Currency = "THB" | "USD";

type FormValues = {
	title: string;
	amount: number;
	currency: Currency;
	description?: string;
	expiresAt?: string;
	customerEmail?: string;
};

function generatePaymentLink(title: string) {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	const id = Math.random().toString(36).slice(2, 8);
	return `https://pay.getzure.com/${slug || "link"}-${id}`;
}

function fieldErrorClass(hasError: boolean) {
	return hasError
		? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
		: "border-zinc-200 focus:border-teal-500 focus:ring-teal-500/20 dark:border-zinc-700";
}

export default function CreatePaymentLinkPage() {
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: { currency: "THB" },
	});

	const [createdLink, setCreatedLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const values = useWatch({ control });

	function onSubmit(data: FormValues) {
		setCreatedLink(generatePaymentLink(data.title));
	}

	function handleCopy() {
		if (!createdLink) return;
		navigator.clipboard.writeText(createdLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	function handleReset() {
		setCreatedLink(null);
		setCopied(false);
		reset();
	}

	const formattedAmount = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: values.currency || "THB",
	}).format(values.amount || 0);

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<Link
				href="/dashboard"
				className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
			>
				<ArrowLeft className="h-4 w-4" />
				<T k="paymentLink.back" />
			</Link>

			<div>
				<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
					<T k="paymentLink.title" />
				</h1>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					<T k="paymentLink.subtitle" />
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
				<div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
					{createdLink ? (
						<div className="flex flex-col items-center py-6 text-center">
							<CircleCheck className="h-10 w-10 text-emerald-500" />
							<h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
								<T k="paymentLink.success.title" />
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
											<T k="paymentLink.success.copied" />
										</>
									) : (
										<>
											<Copy className="h-3.5 w-3.5" />
											<T k="paymentLink.success.copy" />
										</>
									)}
								</button>
							</div>
							<button
								type="button"
								onClick={handleReset}
								className="mt-6 text-sm font-medium text-teal-600 dark:text-teal-400"
							>
								<T k="paymentLink.form.reset" />
							</button>
						</div>
					) : (
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="space-y-5"
							noValidate
						>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									<T k="paymentLink.form.title" />
								</label>
								<input
									type="text"
									{...register("title", {
										required:
											"paymentLink.form.error.required",
									})}
									className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${fieldErrorClass(!!errors.title)}`}
								/>
								{errors.title && (
									<p className="mt-1 text-xs text-rose-500">
										<T
											k={
												errors.title
													.message as TranslationKey
											}
										/>
									</p>
								)}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
								<div>
									<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										<T k="paymentLink.form.amount" />
									</label>
									<input
										type="number"
										step="0.01"
										{...register("amount", {
											required:
												"paymentLink.form.error.required",
											valueAsNumber: true,
											min: {
												value: 1,
												message:
													"paymentLink.form.error.minAmount",
											},
										})}
										className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 sm:w-40 dark:bg-zinc-900 dark:text-zinc-50 ${fieldErrorClass(!!errors.amount)}`}
									/>
									{errors.amount && (
										<p className="mt-1 text-xs text-rose-500">
											<T
												k={
													errors.amount
														.message as TranslationKey
												}
											/>
										</p>
									)}
								</div>
								<div>
									<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										<T k="paymentLink.form.currency" />
									</label>
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
								</div>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									<T k="paymentLink.form.descriptionOptional" />
								</label>
								<textarea
									rows={3}
									{...register("description")}
									className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										<T k="paymentLink.form.expiresAt" />
									</label>
									<input
										type="date"
										{...register("expiresAt")}
										className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										<T k="paymentLink.form.customerEmail" />
									</label>
									<input
										type="email"
										{...register("customerEmail", {
											pattern: {
												value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
												message:
													"paymentLink.form.error.invalidEmail",
											},
										})}
										className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${fieldErrorClass(!!errors.customerEmail)}`}
									/>
									{errors.customerEmail ? (
										<p className="mt-1 text-xs text-rose-500">
											<T
												k={
													errors.customerEmail
														.message as TranslationKey
												}
											/>
										</p>
									) : (
										<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
											<T k="paymentLink.form.customerEmailHint" />
										</p>
									)}
								</div>
							</div>

							<div className="flex justify-end pt-2">
								<button
									type="submit"
									className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
								>
									<T k="paymentLink.form.submit" />
								</button>
							</div>
						</form>
					)}
				</div>

				<div className="lg:col-span-2">
					<p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
						<T k="paymentLink.preview.label" />
					</p>
					<div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-xs font-bold text-white">
								G
							</div>
							<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
								Getzure
							</span>
						</div>

						<p className="mt-6 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
							{formattedAmount}
						</p>
						<p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{values.title || (
								<T k="paymentLink.preview.untitled" />
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
							className="mt-6 w-full cursor-default rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white opacity-90"
						>
							<T k="paymentLink.preview.payButton" />
						</button>
					</div>
					<p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
						<T k="paymentLink.preview.hint" />
					</p>
				</div>
			</div>
		</div>
	);
}
