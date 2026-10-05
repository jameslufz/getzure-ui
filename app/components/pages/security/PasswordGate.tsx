import { ReactNode, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { startReauth } from "@/app/lib/reauth";
import { apiFetch } from "@/app/lib/session";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"

type TPasswordGate = () => ReactNode
type TPasswordGateValues = { password: string }

// Asks for the password once, up front, before the two-factor settings are shown.
export const PasswordGate: TPasswordGate = () => {
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<TPasswordGateValues>()

	const onSubmit: SubmitHandler<TPasswordGateValues> = async (data) => {
		setServerError(null)
		try {
			const res = await apiFetch("/api/security/verify-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: data.password }),
			})
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			startReauth(data.password)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
			<h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
				<T k="security.gate.title">ยืนยันรหัสผ่าน</T>
			</h2>

			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}

			<FormField
				label={<T k="security.twoFactor.password">รหัสผ่านของคุณ</T>}
				error={errors.password && <T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>}
			>
				<input
					type="password"
					autoComplete="current-password"
					autoFocus
					{...register("password", { required: true, maxLength: 128 })}
					aria-invalid={!!errors.password}
					className="input"
				/>
			</FormField>

			<button type="submit" disabled={isSubmitting} className="btn-primary w-full">
				<T k="security.gate.submit">ยืนยัน</T>
			</button>
		</form>
	)
}
