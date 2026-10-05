import { T } from "@/app/i18n/T";
import { BANK_OPTIONS } from "@/app/lib/banks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { parseApiErrorKind, SignupApiError, type TServerErrorKind } from "@/app/lib/signup-errors";
import { Select } from "@/app/components/Select";
import { FormField } from "@/app/components/FormField";
import { getRedirectFromLocation, serviceFetch } from "@/app/lib/session";
import { useLanguage } from "@/app/i18n/useLanguage";
import {
	BANK_ACCOUNT_NO_PATTERN,
	ENGLISH_NAME_PATTERN,
	NAME_MAX_LENGTH,
	THAI_NAME_PATTERN,
} from "@/app/lib/validation"

type TFormInfoProps = {
	isLoading: boolean

	setServerError: (v: TServerErrorKind | null) => void
	setLoading: (v: boolean) => void
	clearOtpStorage: () => void
}
type TFormInfo = (props: TFormInfoProps) => ReactNode
type TFilteredChangeField = { onChange: (e: ChangeEvent<HTMLInputElement>) => void }
type THandleFilteredChange = (
	field: TFilteredChangeField,
	pattern: RegExp,
	transform?: (value: string) => string,
) => (e: ChangeEvent<HTMLInputElement>) => void

const DIGITS_PATTERN = /^\d$/

const infoFormSchema = z.object({
	nameTh: z
		.string({ error: "กรุณากรอกชื่อภาษาไทย" })
		.min(1, { error: "กรุณากรอกชื่อภาษาไทย" })
		.max(NAME_MAX_LENGTH)
		.regex(THAI_NAME_PATTERN, { error: "กรอกได้เฉพาะตัวอักษรภาษาไทยเท่านั้น" }),
	nameEn: z
		.string({ error: "กรุณากรอกชื่อภาษาอังกฤษ" })
		.min(1, { error: "กรุณากรอกชื่อภาษาอังกฤษ" })
		.max(NAME_MAX_LENGTH)
		.regex(ENGLISH_NAME_PATTERN, { error: "กรอกได้เฉพาะตัวอักษรภาษาอังกฤษเท่านั้น" }),
	bank: z.string({ error: "กรุณาเลือกธนาคาร" }).min(1, { error: "กรุณาเลือกธนาคาร" }),
	bankAccountNo: z
		.string({ error: "กรุณากรอกหมายเลขบัญชี" })
		.min(1, { error: "กรุณากรอกหมายเลขบัญชี" })
		.regex(BANK_ACCOUNT_NO_PATTERN, { error: "หมายเลขบัญชีต้องเป็นตัวเลข 10-12 หลักเท่านั้น" }),
})

export type TInfoForm = z.infer<typeof infoFormSchema>

const FormInfo: TFormInfo = ({ isLoading, setServerError, setLoading, clearOtpStorage }) => {
	const router = useRouter()
	const lang = useLanguage()
	const infoForm = useForm<TInfoForm>({
		resolver: zodResolver(infoFormSchema),
		defaultValues: { bank: BANK_OPTIONS[0].value },
	})
	const nameThField = infoForm.register("nameTh")
	const nameEnField = infoForm.register("nameEn")
	const bankAccountNoField = infoForm.register("bankAccountNo")
	const nameThValue = useWatch({ control: infoForm.control, name: "nameTh" })

	const handleFilteredChange: THandleFilteredChange = (field, pattern, transform) => (e) => {
		const filtered = Array.from(e.target.value)
			.filter((char) => pattern.test(char))
			.join("")
		e.target.value = transform ? transform(filtered) : filtered
		field.onChange(e)
	}

	const handleSubmitInfo: SubmitHandler<TInfoForm> = async (data) => {
		setServerError(null)
		setLoading(true)
		try {
			const res = await serviceFetch("/info", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			clearOtpStorage()
			router.push(getRedirectFromLocation() ?? "/dashboard")
		} catch (err) {
			setLoading(false)
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	return (
		<form onSubmit={infoForm.handleSubmit(handleSubmitInfo)} className="space-y-4" noValidate>
			<div className="text-xs font-medium tracking-wide text-zinc-400 uppercase before:content-['Personal_information'] th:before:content-['ข้อมูลส่วนตัว'] dark:text-zinc-500" />

			<FormField
				required
				label={
					<>
						<T k="auth.form.nameTh">ชื่อภาษาไทย</T>{" "}
						<span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
							<T k="auth.form.nameTh.hint">(ไม่ต้องระบุคำนำหน้าชื่อ)</T>
						</span>
					</>
				}
				error={
					infoForm.formState.errors.nameTh && (
						<T k="auth.form.error.required">
							{infoForm.formState.errors.nameTh.message || "กรุณากรอกข้อมูลนี้"}
						</T>
					)
				}
			>
				<input
					type="text"
					autoFocus
					placeholder={lang === "th" ? "เช่น สมชาย ใจดี" : "e.g. สมชาย ใจดี"}
					{...nameThField}
					onChange={handleFilteredChange(nameThField, THAI_NAME_PATTERN)}
					aria-invalid={!!infoForm.formState.errors.nameTh}
					className="input"
				/>
			</FormField>

			<FormField
				required
				label={<T k="auth.form.nameEn">ชื่อภาษาอังกฤษ</T>}
				error={
					infoForm.formState.errors.nameEn && (
						<T k="auth.form.error.required">
							{infoForm.formState.errors.nameEn.message || "กรุณากรอกข้อมูลนี้"}
						</T>
					)
				}
			>
				<input
					type="text"
					placeholder={lang === "th" ? "เช่น SOMCHAI JAIDEE" : "e.g. SOMCHAI JAIDEE"}
					{...nameEnField}
					onChange={handleFilteredChange(nameEnField, ENGLISH_NAME_PATTERN, (v) =>
						v.toUpperCase(),
					)}
					aria-invalid={!!infoForm.formState.errors.nameEn}
					className="input"
				/>
			</FormField>

			<div className="pt-2 text-xs font-medium tracking-wide text-zinc-400 uppercase before:content-['Bank_account'] th:before:content-['บัญชีธนาคาร'] dark:text-zinc-500" />

			<FormField
				required
				label={<T k="auth.form.bank">ธนาคาร</T>}
				error={
					infoForm.formState.errors.bank && (
						<T k="auth.form.error.required">
							{infoForm.formState.errors.bank.message || "กรุณากรอกข้อมูลนี้"}
						</T>
					)
				}
			>
				<Controller
					name="bank"
					control={infoForm.control}
					render={({ field }) => (
						<Select
							value={field.value || ""}
							onChange={field.onChange}
							options={BANK_OPTIONS}
						/>
					)}
				/>
			</FormField>

			<FormField
				required
				label={<T k="auth.form.bankAccountNo">หมายเลขบัญชี</T>}
				error={
					infoForm.formState.errors.bankAccountNo && (
						<T k="auth.form.error.required">
							{infoForm.formState.errors.bankAccountNo.message ||
								"กรุณากรอกข้อมูลนี้"}
						</T>
					)
				}
			>
				<input
					type="text"
					inputMode="numeric"
					maxLength={12}
					placeholder={lang === "th" ? "เช่น 1234567890" : "e.g. 1234567890"}
					{...bankAccountNoField}
					onChange={handleFilteredChange(bankAccountNoField, DIGITS_PATTERN)}
					aria-invalid={!!infoForm.formState.errors.bankAccountNo}
					className="input"
				/>
			</FormField>

			<FormField
				label={<T k="auth.form.bankAccountName">ชื่อบัญชีธนาคาร</T>}
				hint={
					<T k="auth.form.bankAccountNameHint">
						ชื่อบัญชีต้องตรงกับชื่อที่ใช้สมัครเท่านั้น
					</T>
				}
			>
				<input
					type="text"
					readOnly
					value={nameThValue || ""}
					placeholder={
						lang === "th"
							? "จะเติมให้อัตโนมัติจากชื่อภาษาไทยด้านบน"
							: "Auto-filled from the Thai name above"
					}
					className="input"
				/>
			</FormField>

			<button type="submit" disabled={isLoading} className="btn-primary w-full">
				<T k="auth.signUp.info.submit">ดำเนินการต่อ</T>
			</button>
		</form>
	)
}

export default FormInfo
