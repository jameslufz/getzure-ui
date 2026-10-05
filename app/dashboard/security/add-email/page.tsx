"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { PageHeader } from "@/app/components/PageHeader";
import { authClient } from "@/app/lib/auth-client";
import { useSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { showToast } from "@/app/lib/toast";
import {
	kindFromAuthClientError,
	SERVER_ERROR_MESSAGES,
	TServerErrorKind,
} from "@/app/lib/signup-errors"

type TEmailStep = "email" | "code"
type TAddEmailForm = { email: string; code: string }
type TAddEmailPage = () => React.ReactNode

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TWO_FACTOR_PATH = "/dashboard/security/two-factor"

// Adds and verifies the account's email with a code sent to it. It is needed for the email code
// second step, and it becomes the address used to sign in with a password.
const AddEmailPage: TAddEmailPage = () => {
	const router = useRouter()
	const { status } = useSecurityStatus()
	const [step, setStep] = useState<TEmailStep>("email")
	const [pendingEmail, setPendingEmail] = useState("")
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<TAddEmailForm>()

	const handleRequestCode: SubmitHandler<TAddEmailForm> = async (data) => {
		const { error } = await authClient.emailOtp.requestEmailChange({ newEmail: data.email })
		if (error) return setServerError(kindFromAuthClientError(error))
		setPendingEmail(data.email)
		setStep("code")
	}

	const handleVerifyCode: SubmitHandler<TAddEmailForm> = async (data) => {
		const { error } = await authClient.emailOtp.changeEmail({
			newEmail: pendingEmail,
			otp: data.code,
		})
		if (error) return setServerError(kindFromAuthClientError(error))
		showToast(<T k="security.addEmail.done">เพิ่มอีเมลแล้ว</T>)
		router.push(TWO_FACTOR_PATH)
	}

	const onSubmit: SubmitHandler<TAddEmailForm> = async (data) => {
		setServerError(null)
		return step === "email" ? handleRequestCode(data) : handleVerifyCode(data)
	}

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<Link
				href={TWO_FACTOR_PATH}
				className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
			>
				<ArrowLeft className="h-4 w-4" />
				<T k="security.back">กลับไปที่ความปลอดภัยสองชั้น</T>
			</Link>

			<PageHeader
				title={<T k="security.addEmail.title">เพิ่มอีเมลของคุณ</T>}
				subtitle={
					<T k="security.addEmail.subtitle">
						เราจะส่งรหัสไปยืนยันอีเมลนี้ และใช้เป็นอีเมลสำหรับเข้าสู่ระบบด้วย
					</T>
				}
			/>

			<div className="card">
				{status?.emailVerified ? (
					<p className="text-sm text-zinc-600 dark:text-zinc-300">
						<T k="security.addEmail.already">บัญชีนี้มีอีเมลที่ยืนยันแล้ว</T>:{" "}
						{status.email}
					</p>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
						{serverError && (
							<p className="alert-error">
								<T k={SERVER_ERROR_MESSAGES[serverError].key}>
									{SERVER_ERROR_MESSAGES[serverError].th}
								</T>
							</p>
						)}

						{step === "email" ? (
							<>
								<FormField
									label={<T k="security.twoFactor.email.label">อีเมลของคุณ</T>}
									error={
										errors.email && (
											<T k="auth.form.error.invalidEmail">
												กรุณากรอกอีเมลที่ถูกต้อง
											</T>
										)
									}
								>
									<input
										type="email"
										autoComplete="email"
										autoFocus
										{...register("email", {
											required: true,
											pattern: EMAIL_PATTERN,
										})}
										aria-invalid={!!errors.email}
										className="input"
									/>
								</FormField>
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-primary w-full"
								>
									<T k="security.twoFactor.sendCode">ส่งรหัสยืนยัน</T>
								</button>
							</>
						) : (
							<>
								<p className="text-sm text-zinc-600 dark:text-zinc-300">
									<T k="security.twoFactor.codeSentTo">เราได้ส่งรหัสไปที่</T>{" "}
									{pendingEmail}
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
										{...register("code", { required: true })}
										aria-invalid={!!errors.code}
										className="input"
									/>
								</FormField>
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-primary w-full"
								>
									<T k="security.twoFactor.verify">ยืนยันอีเมล</T>
								</button>
								<button
									type="button"
									onClick={() => setStep("email")}
									className="w-full text-center text-sm text-zinc-500 dark:text-zinc-400"
								>
									<T k="security.twoFactor.changeEmail">เปลี่ยนอีเมล</T>
								</button>
							</>
						)}
					</form>
				)}
			</div>
		</div>
	)
}

export default AddEmailPage
