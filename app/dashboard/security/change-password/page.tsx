"use client"

import { useState } from "react";
import Link from "next/link";
import { Mail, Smartphone } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { PageHeader } from "@/app/components/PageHeader";
import { useSecurityStatus } from "@/app/hooks/useSecurityStatus";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { apiFetch } from "@/app/lib/session";
import {
	PASSWORD_LETTER_AND_DIGIT_PATTERN,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	TPasswordVerifyMethod,
} from "@/app/lib/validation"

type TPasswordForm = {
	code: string
	newPassword: string
	confirmPassword: string
}

type TChangePasswordPage = () => React.ReactNode

const ChangePasswordPage: TChangePasswordPage = () => {
	const { status, refresh } = useSecurityStatus()
	const [method, setMethod] = useState<TPasswordVerifyMethod | null>(null)
	const [codeSent, setCodeSent] = useState(false)
	const [sending, setSending] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const [saved, setSaved] = useState(false)
	const {
		register,
		handleSubmit,
		reset,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<TPasswordForm>()

	const destinations: Record<TPasswordVerifyMethod, string | null> = {
		phone: status?.phone ?? null,
		email: status?.email ?? null,
	}
	const availableMethods = (["phone", "email"] as TPasswordVerifyMethod[]).filter(
		(option) => destinations[option],
	)

	const postJson = async (url: string, body: object) => {
		const res = await apiFetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
		if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
	}

	const handleSendCode = async () => {
		if (!method) return
		setServerError(null)
		setSaved(false)
		setSending(true)
		try {
			await postJson("/api/security/password/send-code", { method })
			setCodeSent(true)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		} finally {
			setSending(false)
		}
	}

	const handleChangeMethod = () => {
		setCodeSent(false)
		setServerError(null)
		reset()
	}

	const onSubmit: SubmitHandler<TPasswordForm> = async (data) => {
		setServerError(null)
		try {
			await postJson("/api/security/password", {
				method,
				code: data.code,
				newPassword: data.newPassword,
			})
			reset()
			setCodeSent(false)
			setMethod(null)
			setSaved(true)
			refresh()
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<PageHeader
				title={<T k="security.password.title">เปลี่ยนรหัสผ่าน</T>}
				subtitle={
					status?.hasPassword === false ? (
						<T k="security.password.subtitleSet">
							บัญชีของคุณยังไม่มีรหัสผ่าน
							ตั้งรหัสผ่านเพื่อใช้เข้าสู่ระบบและเปิดใช้งานความปลอดภัยสองชั้น
						</T>
					) : (
						<T k="security.password.subtitle">
							ยืนยันตัวตนด้วยรหัส OTP ก่อน แล้วตั้งรหัสผ่านใหม่ (8-128 ตัวอักษร
							มีทั้งตัวอักษรและตัวเลข)
						</T>
					)
				}
			/>

			<div className="card space-y-4">
				{serverError && (
					<p className="alert-error">
						<T k={SERVER_ERROR_MESSAGES[serverError].key}>
							{SERVER_ERROR_MESSAGES[serverError].th}
						</T>
					</p>
				)}
				{saved && (
					<p className="alert-success">
						<T k="security.password.saved">บันทึกรหัสผ่านเรียบร้อยแล้ว</T>
					</p>
				)}

				{!status ? (
					<div className="h-24 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
				) : availableMethods.length === 0 ? (
					<p className="alert-error">
						<T k="security.password.noMethod">
							ยังไม่มีช่องทางสำหรับยืนยันตัวตน กรุณายืนยันอีเมลของคุณก่อน
						</T>{" "}
						<Link href="/dashboard/security/two-factor" className="link underline">
							<T k="security.password.noMethodLink">ไปที่หน้าความปลอดภัยสองชั้น</T>
						</Link>
					</p>
				) : !codeSent ? (
					<>
						<p className="label">
							<T k="security.password.chooseMethod">เลือกช่องทางรับรหัสยืนยัน</T>
						</p>
						<div role="radiogroup" className="space-y-2">
							{availableMethods.map((option) => (
								<button
									key={option}
									type="button"
									role="radio"
									aria-checked={method === option}
									onClick={() => setMethod(option)}
									className="option"
								>
									{option === "phone" ? (
										<Smartphone className="h-5 w-5 text-zinc-400" />
									) : (
										<Mail className="h-5 w-5 text-zinc-400" />
									)}
									<span>
										<span className="block font-medium text-zinc-900 dark:text-zinc-50">
											{option === "phone" ? (
												<T k="security.password.method.phone">
													รหัส OTP ทาง SMS
												</T>
											) : (
												<T k="security.password.method.email">
													รหัส OTP ทางอีเมล
												</T>
											)}
										</span>
										<span className="text-zinc-500 dark:text-zinc-400">
											{destinations[option]}
										</span>
									</span>
								</button>
							))}
						</div>
						<button
							type="button"
							disabled={!method || sending}
							onClick={handleSendCode}
							className="btn-primary w-full"
						>
							<T k="security.password.sendCode">ส่งรหัสยืนยัน</T>
						</button>
					</>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
						<p className="text-sm text-zinc-600 dark:text-zinc-300">
							<T k="security.password.codeSentTo">เราได้ส่งรหัสไปที่</T>{" "}
							{method && destinations[method]}
						</p>

						<FormField
							label={<T k="auth.form.otp">รหัสยืนยัน</T>}
							error={
								errors.code && (
									<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
								)
							}
						>
							<input
								type="text"
								inputMode="numeric"
								autoComplete="one-time-code"
								autoFocus
								{...register("code", { required: true, pattern: /^\d{4,8}$/ })}
								aria-invalid={!!errors.code}
								className="input"
							/>
						</FormField>

						<FormField
							label={<T k="security.password.new">รหัสผ่านใหม่</T>}
							error={
								errors.newPassword && (
									<T k="security.password.error.rule">
										รหัสผ่านต้องมี 8-128 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข
									</T>
								)
							}
						>
							<input
								type="password"
								autoComplete="new-password"
								{...register("newPassword", {
									required: true,
									minLength: PASSWORD_MIN_LENGTH,
									maxLength: PASSWORD_MAX_LENGTH,
									pattern: PASSWORD_LETTER_AND_DIGIT_PATTERN,
								})}
								aria-invalid={!!errors.newPassword}
								className="input"
							/>
						</FormField>

						<FormField
							label={<T k="security.password.confirm">ยืนยันรหัสผ่านใหม่</T>}
							error={
								errors.confirmPassword && (
									<T k="security.password.error.mismatch">รหัสผ่านไม่ตรงกัน</T>
								)
							}
						>
							<input
								type="password"
								autoComplete="new-password"
								{...register("confirmPassword", {
									validate: (value) => value === getValues("newPassword"),
								})}
								aria-invalid={!!errors.confirmPassword}
								className="input"
							/>
						</FormField>

						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-primary w-full"
						>
							<T k="security.password.submit">บันทึกรหัสผ่าน</T>
						</button>

						<div className="flex items-center justify-between text-sm">
							<button
								type="button"
								onClick={handleChangeMethod}
								className="text-zinc-500 dark:text-zinc-400"
							>
								<T k="security.password.changeMethod">เลือกช่องทางอื่น</T>
							</button>
							<button
								type="button"
								disabled={sending}
								onClick={handleSendCode}
								className="link"
							>
								<T k="security.password.resend">ส่งรหัสอีกครั้ง</T>
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}

export default ChangePasswordPage
