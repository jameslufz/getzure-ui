"use client"

import { ReactNode } from "react";
import { NumericFormat } from "react-number-format";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { Select } from "@/app/components/Select";
import { BANK_OPTIONS } from "@/app/lib/banks";
import { isPlaceholderEmail } from "@/app/lib/user-email";
import {
	BANK_ACCOUNT_NO_PATTERN,
	EMAIL_MAX_LENGTH,
	EMAIL_PATTERN,
	NAME_MAX_LENGTH,
	PHONE_NUMBER_PATTERN,
	THAI_NAME_PATTERN,
} from "@/app/lib/validation"

export type TPayerType = "member" | "guest"
export type TGuestPayer = {
	phoneNumber: string
	fullNameTh: string
	bankCode: string
	bankAccountNo: string
}
export type TPayer = {
	// null until the creator chooses: the choice is required.
	type: TPayerType | null
	// The member payer's phone number or email, as typed.
	member: string
	guest: TGuestPayer
}
export type TPayerErrors = {
	type: boolean
	member: boolean
	phoneNumber: boolean
	fullNameTh: boolean
	bankCode: boolean
	bankAccountNo: boolean
}

type TPayerFieldsProps = {
	payer: TPayer
	onChange: (payer: TPayer) => void
	// Errors are only shown once the creator has tried to submit.
	errors: TPayerErrors | null
}
type TPayerFields = (props: TPayerFieldsProps) => ReactNode
type TNormaliseMember = (raw: string) => string | null
type TValidatePayer = (payer: TPayer) => TPayerErrors
type TAppendPayer = (formData: FormData, payer: TPayer) => void
type TSetGuest = (field: keyof TGuestPayer, value: string) => void

export const EMPTY_PAYER: TPayer = {
	type: null,
	member: "",
	guest: { phoneNumber: "", fullNameTh: "", bankCode: "", bankAccountNo: "" },
}

// A phone number as typed, or an email in lower case. The generated address of a phone sign-up
// can't receive mail, so it isn't a payer.
const normaliseMember: TNormaliseMember = (raw) => {
	if (PHONE_NUMBER_PATTERN.test(raw)) return raw

	const email = raw.toLowerCase()
	const isEmail = email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)
	return isEmail && !isPlaceholderEmail(email) ? email : null
}

// Client-side checks are for a quick answer only; the server checks everything again.
export const validatePayer: TValidatePayer = (payer) => {
	const { guest } = payer
	const isGuest = payer.type === "guest"

	return {
		type: payer.type === null,
		member: payer.type === "member" && normaliseMember(payer.member.trim()) === null,
		phoneNumber: isGuest && !PHONE_NUMBER_PATTERN.test(guest.phoneNumber),
		fullNameTh:
			isGuest &&
			(!THAI_NAME_PATTERN.test(guest.fullNameTh.trim()) ||
				guest.fullNameTh.trim().length > NAME_MAX_LENGTH),
		bankCode: isGuest && !BANK_OPTIONS.some((option) => option.value === guest.bankCode),
		bankAccountNo: isGuest && !BANK_ACCOUNT_NO_PATTERN.test(guest.bankAccountNo),
	}
}

export const hasPayerError = (errors: TPayerErrors) => Object.values(errors).some(Boolean)

export const appendPayer: TAppendPayer = (formData, payer) => {
	if (payer.type === null) return

	formData.append("payerType", payer.type)
	if (payer.type === "member") {
		formData.append("customers", normaliseMember(payer.member.trim()) ?? "")
		return
	}

	formData.append("guestPhoneNumber", payer.guest.phoneNumber)
	formData.append("guestFullNameTh", payer.guest.fullNameTh.trim())
	formData.append("guestBankCode", payer.guest.bankCode)
	formData.append("guestBankAccountNo", payer.guest.bankAccountNo)
}

export const PayerFields: TPayerFields = ({ payer, onChange, errors }) => {
	const setGuest: TSetGuest = (field, value) => {
		onChange({ ...payer, guest: { ...payer.guest, [field]: value } })
	}

	return (
		<FormField
			required
			label={<T k="orders.create.payer">ผู้ชำระ</T>}
			error={
				errors?.type ? (
					<T k="orders.create.errorPayerType">กรุณาเลือกว่าผู้ชำระเป็นสมาชิกหรือแขก</T>
				) : null
			}
		>
			<div className="space-y-4">
				<div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<button
						type="button"
						role="radio"
						aria-checked={payer.type === "member"}
						onClick={() => onChange({ ...payer, type: "member" })}
						className="option"
					>
						<span>
							<span className="block font-medium text-zinc-900 dark:text-zinc-50">
								<T k="orders.create.payerMember">สมาชิกในระบบ</T>
							</span>
							<span className="block text-xs text-zinc-500 dark:text-zinc-400">
								<T k="orders.create.payerMemberHint">ค้นหาจากเบอร์โทรหรืออีเมล</T>
							</span>
						</span>
					</button>
					<button
						type="button"
						role="radio"
						aria-checked={payer.type === "guest"}
						onClick={() => onChange({ ...payer, type: "guest" })}
						className="option"
					>
						<span>
							<span className="block font-medium text-zinc-900 dark:text-zinc-50">
								<T k="orders.create.payerGuest">แขก (Guest)</T>
							</span>
							<span className="block text-xs text-zinc-500 dark:text-zinc-400">
								<T k="orders.create.payerGuestHint">กรอกข้อมูลผู้ชำระเอง</T>
							</span>
						</span>
					</button>
				</div>

				{payer.type === "member" && (
					<FormField
						error={
							errors?.member ? (
								<T k="orders.create.errorPayerMember">
									กรุณาระบุเบอร์โทรหรืออีเมลผู้ชำระให้ถูกต้อง
								</T>
							) : null
						}
					>
						<input
							type="text"
							value={payer.member}
							onChange={(event) => onChange({ ...payer, member: event.target.value })}
							aria-invalid={errors?.member}
							placeholder="ระบุเบอร์โทรหรืออีเมลผู้ชำระ"
							className="input"
						/>
					</FormField>
				)}

				{payer.type === "guest" && (
					<div className="space-y-4">
						<FormField
							required
							label={<T k="orders.create.guestPhone">เบอร์โทรศัพท์</T>}
							error={
								errors?.phoneNumber ? (
									<T k="auth.form.error.invalidPhone">รูปแบบเบอร์โทรไม่ถูกต้อง</T>
								) : null
							}
						>
							<NumericFormat
								type="text"
								allowLeadingZeros
								allowNegative={false}
								maxLength={10}
								placeholder="0812345678"
								value={payer.guest.phoneNumber}
								onValueChange={(values) => setGuest("phoneNumber", values.value)}
								aria-invalid={errors?.phoneNumber}
								className="input"
							/>
						</FormField>

						<FormField
							required
							label={<T k="orders.create.guestName">ชื่อจริง (ภาษาไทย)</T>}
							error={
								errors?.fullNameTh ? (
									<T k="orders.create.errorGuestName">
										กรุณากรอกชื่อจริงเป็นภาษาไทยเท่านั้น
									</T>
								) : null
							}
						>
							<input
								type="text"
								maxLength={NAME_MAX_LENGTH}
								value={payer.guest.fullNameTh}
								onChange={(event) => setGuest("fullNameTh", event.target.value)}
								aria-invalid={errors?.fullNameTh}
								className="input"
							/>
						</FormField>

						<FormField
							required
							label={<T k="auth.form.bank">ธนาคาร</T>}
							error={
								errors?.bankCode ? (
									<T k="orders.create.errorGuestBank">กรุณาเลือกธนาคาร</T>
								) : null
							}
						>
							<Select
								value={payer.guest.bankCode}
								onChange={(value) => setGuest("bankCode", value)}
								options={BANK_OPTIONS}
								placeholder={<T k="orders.create.pickBank">เลือกธนาคาร</T>}
								invalid={errors?.bankCode}
							/>
						</FormField>

						<FormField
							required
							label={<T k="auth.form.bankAccountNo">หมายเลขบัญชี</T>}
							error={
								errors?.bankAccountNo ? (
									<T k="orders.create.errorGuestAccount">
										หมายเลขบัญชีต้องเป็นตัวเลข 10-12 หลักเท่านั้น
									</T>
								) : null
							}
						>
							<NumericFormat
								type="text"
								allowLeadingZeros
								allowNegative={false}
								maxLength={12}
								value={payer.guest.bankAccountNo}
								onValueChange={(values) => setGuest("bankAccountNo", values.value)}
								aria-invalid={errors?.bankAccountNo}
								className="input"
							/>
						</FormField>
					</div>
				)}
			</div>
		</FormField>
	)
}
