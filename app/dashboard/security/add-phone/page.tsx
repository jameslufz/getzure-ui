"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { PageHeader } from "@/app/components/PageHeader";
import { authClient } from "@/app/lib/auth-client";
import { useSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { showToast } from "@/app/lib/toast";
import {
	kindFromAuthClientError,
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import {
	createOtpStorage,
	formatCountdown,
	getResendWindow,
	isOtpSessionExpired,
	useSecondsUntil,
} from "@/app/lib/otp-session"
import { PHONE_NUMBER_PATTERN } from "@/app/lib/validation";

type TPhoneStep = "phone" | "code"
type TAddPhoneForm = { phoneNumber: string; code: string }
type TAddPhonePage = () => React.ReactNode

const TWO_FACTOR_PATH = "/dashboard/security/two-factor"

// Remembers the code step like the sign-up screen does, under its own key.
const otpStorage = createOtpStorage("getzure:otpAddPhone")

type TSendCode = (phoneNumber: string) => Promise<void>
type TRestoreOtpStep = (stored: NonNullable<ReturnType<typeof otpStorage.read>>) => void

// Adds and verifies a phone number with a code texted to it. Once added it can receive the SMS
// second-step code, and it also becomes a number a sign-in code can be sent to.
const AddPhonePage: TAddPhonePage = () => {
	const router = useRouter()
	const { status } = useSecurityStatus()
	const [step, setStep] = useState<TPhoneStep>("phone")
	const [pendingPhone, setPendingPhone] = useState("")
	const [otpRef, setOtpRef] = useState("")
	const [resendAvailableAt, setResendAvailableAt] = useState(0)
	const resendCooldown = useSecondsUntil(resendAvailableAt)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TAddPhoneForm>()

	// Coming back (a refresh, or leaving and returning) resumes the same code step, Ref and
	// countdown, as long as the 5-minute window hasn't passed.
	useEffect(() => {
		const stored = otpStorage.read()
		if (!stored) return

		if (isOtpSessionExpired(stored)) {
			otpStorage.clear()
			return
		}

		const restoreOtpStep: TRestoreOtpStep = (saved) => {
			setPendingPhone(saved.phoneNumber)
			setOtpRef(saved.otpRef)
			setResendAvailableAt(saved.resendAvailableAt)
			setStep("code")
		}
		restoreOtpStep(stored)
	}, [])

	const sendCode: TSendCode = async (phoneNumber) => {
		const res = await fetch("/api/send-phone-otp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ phoneNumber }),
		})
		if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))

		const body: { otpRef?: string } = await res.json()
		const { now, availableAt } = getResendWindow()
		setPendingPhone(phoneNumber)
		setOtpRef(body.otpRef ?? "")
		setResendAvailableAt(availableAt)
		otpStorage.save({
			phoneNumber,
			otpRef: body.otpRef ?? "",
			otpSentAt: now,
			resendAvailableAt: availableAt,
		})
	}

	const handleSendCode: SubmitHandler<TAddPhoneForm> = async (data) => {
		try {
			await sendCode(data.phoneNumber)
			setStep("code")
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	const handleResendCode = async () => {
		setServerError(null)
		try {
			await sendCode(pendingPhone)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	const handleChangeNumber = () => {
		otpStorage.clear()
		setResendAvailableAt(0)
		setServerError(null)
		reset()
		setStep("phone")
	}

	const handleVerifyCode: SubmitHandler<TAddPhoneForm> = async (data) => {
		const { error } = await authClient.phoneNumber.verify({
			phoneNumber: pendingPhone,
			code: data.code,
			updatePhoneNumber: true,
		})
		if (error) return setServerError(kindFromAuthClientError(error))
		otpStorage.clear()
		showToast(<T k="security.addPhone.done">เพิ่มเบอร์โทรศัพท์แล้ว</T>)
		router.push(TWO_FACTOR_PATH)
	}

	const onSubmit: SubmitHandler<TAddPhoneForm> = async (data) => {
		setServerError(null)
		return step === "phone" ? handleSendCode(data) : handleVerifyCode(data)
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
				title={<T k="security.addPhone.title">เพิ่มเบอร์โทรศัพท์ของคุณ</T>}
				subtitle={
					<T k="security.addPhone.subtitle">
						เราจะส่งรหัสทาง SMS เพื่อยืนยันเบอร์นี้ และใช้รับรหัสยืนยันตอนเข้าสู่ระบบได้
					</T>
				}
			/>

			<div className="card">
				{status?.phone ? (
					<p className="text-sm text-zinc-600 dark:text-zinc-300">
						<T k="security.addPhone.already">บัญชีนี้มีเบอร์โทรศัพท์ที่ยืนยันแล้ว</T>:{" "}
						{status.phone}
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

						{step === "phone" ? (
							<>
								<FormField
									label={<T k="security.addPhone.label">เบอร์โทรศัพท์</T>}
									error={
										errors.phoneNumber && (
											<T k="auth.form.error.invalidPhone">
												กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง เช่น 0812345678
											</T>
										)
									}
								>
									<Controller
										name="phoneNumber"
										control={control}
										rules={{ required: true, pattern: PHONE_NUMBER_PATTERN }}
										render={({ field }) => (
											<NumericFormat
												type="text"
												allowLeadingZeros
												allowNegative={false}
												maxLength={10}
												placeholder="0812345678"
												value={field.value}
												onValueChange={(values) =>
													field.onChange(values.value)
												}
												onBlur={field.onBlur}
												aria-invalid={!!errors.phoneNumber}
												className="input"
											/>
										)}
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
								<p className="text-sm text-zinc-500 dark:text-zinc-400">
									<T k="auth.signUp.otpSentTo">เราได้ส่งรหัสไปที่</T>{" "}
									<span className="font-medium text-zinc-900 dark:text-zinc-50">
										{pendingPhone}
									</span>{" "}
									<span className="text-zinc-400 dark:text-zinc-500">
										(Ref: {otpRef})
									</span>
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
									<T k="security.addPhone.button">เพิ่มเบอร์โทรศัพท์</T>
								</button>
								<div className="flex items-center justify-between text-sm">
									<button
										type="button"
										onClick={handleChangeNumber}
										className="link disabled:opacity-40"
										disabled={resendCooldown > 0}
									>
										<T k="auth.signUp.changeNumber">เปลี่ยนเบอร์โทรศัพท์</T>
									</button>
									{resendCooldown > 0 ? (
										<span className="text-zinc-400 dark:text-zinc-500">
											<T k="auth.signUp.resendCodeIn">ส่งรหัสอีกครั้งใน</T>{" "}
											{formatCountdown(resendCooldown)}
										</span>
									) : (
										<button
											type="button"
											onClick={handleResendCode}
											className="text-zinc-500 hover:text-teal-200 dark:text-zinc-400"
										>
											<T k="auth.signUp.resendCode">ส่งรหัสอีกครั้ง</T>
										</button>
									)}
								</div>
							</>
						)}
					</form>
				)}
			</div>
		</div>
	)
}

export default AddPhonePage
