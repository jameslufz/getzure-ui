"use client"

import { ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { Select } from "@/app/components/Select";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { BANK_OPTIONS } from "@/app/lib/banks";
import { serviceFetch } from "@/app/lib/session";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { BANK_ACCOUNT_NO_PATTERN } from "@/app/lib/validation";

type TBankEditFormProps = {
	initialBank: string
	onSaved: () => void
	onCancel: () => void
}
type TBankEditForm = (props: TBankEditFormProps) => ReactNode
type TBankValues = { bank: string; bankAccountNo: string; password: string }
type TSaveBank = (values: TBankValues) => Promise<void>

const saveBank: TSaveBank = async (values) => {
	const res = await serviceFetch("/profile/bank", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(values),
	})
	if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
}

export const BankEditForm: TBankEditForm = ({ initialBank, onSaved, onCancel }) => {
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const { afterProfileChange } = useInvalidate()
	const saveMutation = useMutation({ mutationFn: saveBank, onSuccess: afterProfileChange })
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<TBankValues>({ defaultValues: { bank: initialBank } })

	const onSubmit: SubmitHandler<TBankValues> = async (data) => {
		setServerError(null)

		try {
			await saveMutation.mutateAsync(data)
			onSaved()
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-3" noValidate>
			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}

			<FormField
				required
				label={<T k="profile.bank">ธนาคาร</T>}
				error={errors.bank && <T k="profile.bankPickError">กรุณาเลือกธนาคาร</T>}
			>
				<Controller
					name="bank"
					control={control}
					rules={{ required: true }}
					render={({ field }) => (
						<Select
							value={field.value}
							onChange={field.onChange}
							options={BANK_OPTIONS}
							invalid={!!errors.bank}
						/>
					)}
				/>
			</FormField>

			<FormField
				required
				label={<T k="profile.accountNo">เลขบัญชี</T>}
				error={
					errors.bankAccountNo && (
						<T k="profile.bankAccountError">เลขบัญชีต้องเป็นตัวเลข 10-12 หลัก</T>
					)
				}
			>
				<Controller
					name="bankAccountNo"
					control={control}
					rules={{
						required: true,
						validate: (value) => BANK_ACCOUNT_NO_PATTERN.test(value),
					}}
					render={({ field }) => (
						<NumericFormat
							allowLeadingZeros
							allowNegative={false}
							maxLength={12}
							inputMode="numeric"
							value={field.value}
							onValueChange={(values) => field.onChange(values.value)}
							onBlur={field.onBlur}
							aria-invalid={!!errors.bankAccountNo}
							className="input"
						/>
					)}
				/>
			</FormField>

			<FormField
				required
				label={<T k="profile.bankPassword">รหัสผ่านของคุณ</T>}
				hint={<T k="profile.bankPasswordHint">ต้องใช้รหัสผ่านเพื่อเปลี่ยนบัญชีธนาคาร</T>}
				error={errors.password && <T k="profile.passwordError">กรุณากรอกรหัสผ่าน</T>}
			>
				<input
					type="password"
					autoComplete="current-password"
					{...register("password", { required: true })}
					aria-invalid={!!errors.password}
					className="input"
				/>
			</FormField>

			<div className="flex justify-end gap-2">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="btn-outline"
				>
					<T k="profile.cancel">ยกเลิก</T>
				</button>
				<button type="submit" disabled={isSubmitting} className="btn-primary">
					<T k="profile.saveBank">บันทึก</T>
				</button>
			</div>
		</form>
	)
}
