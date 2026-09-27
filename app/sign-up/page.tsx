"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { authClient } from "@/app/lib/auth-client";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";

type PhoneFormValues = {
	phoneNumber: string
}

type OtpFormValues = {
	code: string
}

const fieldClass = (hasError: boolean) => {
	return `w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-hidden focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${
		hasError
			? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
			: "border-zinc-200 focus:border-teal-500 focus:ring-teal-500/20 dark:border-zinc-700"
	}`
}

const SignUpPage = () => {
	const router = useRouter()
	const [step, setStep] = useState<"phone" | "otp">("phone")
	const [phoneNumber, setPhoneNumber] = useState("")
	const [serverError, setServerError] = useState(false)
	const [loading, setLoading] = useState(false)

	const phoneForm = useForm<PhoneFormValues>()
	const otpForm = useForm<OtpFormValues>()

	const onSendCode = (data: PhoneFormValues) => {
		setServerError(false)
		setLoading(true)
		authClient.phoneNumber.sendOtp(
			{ phoneNumber: data.phoneNumber },
			{
				onSuccess: () => {
					setPhoneNumber(data.phoneNumber)
					setStep("otp")
					setLoading(false)
				},
				onError: () => {
					setLoading(false)
					setServerError(true)
				},
			},
		)
	}

	const onVerify = (data: OtpFormValues) => {
		setServerError(false)
		setLoading(true)
		authClient.phoneNumber.verify(
			{ phoneNumber, code: data.code },
			{
				onSuccess: () => router.push("/dashboard"),
				onError: () => {
					setLoading(false)
					setServerError(true)
				},
			},
		)
	}

	const handleChangeNumber = () => {
		setStep("phone")
		setServerError(false)
		otpForm.reset()
	}

	const handleResendCode = () => {
		authClient.phoneNumber.sendOtp({ phoneNumber })
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
			<div className="absolute top-4 right-4 flex items-center gap-2">
				<LanguageToggle />
				<ThemeToggle />
			</div>

			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3 text-center">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-600 text-sm font-bold text-white">
						G
					</div>
					<div>
						<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
							<T k="auth.signUp.title">สร้างบัญชีใหม่</T>
						</h1>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="auth.signUp.subtitle">เริ่มรับชำระเงินด้วย Getzure</T>
						</p>
					</div>
				</div>

				<div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
					{serverError && (
						<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
							<T k="auth.error.generic">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</T>
						</p>
					)}

					{step === "phone" ? (
						<form
							onSubmit={phoneForm.handleSubmit(onSendCode)}
							className="space-y-4"
							noValidate
						>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									<T k="auth.form.phone">เบอร์โทรศัพท์</T>
								</label>
								<input
									type="tel"
									placeholder="+66812345678"
									{...phoneForm.register("phoneNumber", {
										required: true,
										pattern: /^\+[1-9]\d{7,14}$/,
									})}
									className={fieldClass(!!phoneForm.formState.errors.phoneNumber)}
								/>
								{phoneForm.formState.errors.phoneNumber && (
									<p className="mt-1 text-xs text-rose-500">
										<T k="auth.form.error.invalidPhone">
											กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง เช่น +66812345678
										</T>
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
							>
								<T k="auth.signUp.sendCode">ส่งรหัสยืนยัน</T>
							</button>

							<div className="flex items-center gap-3">
								<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
								<span className="text-xs text-zinc-400 dark:text-zinc-500">
									<T k="auth.orContinueWith">หรือดำเนินการต่อด้วย</T>
								</span>
								<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
							</div>

							<GoogleSignInButton />
						</form>
					) : (
						<form
							onSubmit={otpForm.handleSubmit(onVerify)}
							className="space-y-4"
							noValidate
						>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								<T k="auth.signUp.otpSentTo">เราได้ส่งรหัสไปที่</T>{" "}
								<span className="font-medium text-zinc-900 dark:text-zinc-50">
									{phoneNumber}
								</span>
							</p>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									<T k="auth.form.otp">รหัสยืนยัน</T>
								</label>
								<input
									type="text"
									inputMode="numeric"
									autoFocus
									{...otpForm.register("code", { required: true })}
									className={fieldClass(!!otpForm.formState.errors.code)}
								/>
								{otpForm.formState.errors.code && (
									<p className="mt-1 text-xs text-rose-500">
										<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
							>
								<T k="auth.signUp.verify">ยืนยันและเข้าสู่ระบบ</T>
							</button>

							<div className="flex items-center justify-between text-sm">
								<button
									type="button"
									onClick={handleChangeNumber}
									className="font-medium text-teal-600 dark:text-teal-400"
								>
									<T k="auth.signUp.changeNumber">เปลี่ยนเบอร์โทรศัพท์</T>
								</button>
								<button
									type="button"
									onClick={handleResendCode}
									className="text-zinc-500 dark:text-zinc-400"
								>
									<T k="auth.signUp.resendCode">ส่งรหัสอีกครั้ง</T>
								</button>
							</div>
						</form>
					)}
				</div>

				<p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
					<T k="auth.signUp.haveAccount">มีบัญชีอยู่แล้ว?</T>{" "}
					<Link href="/sign-in" className="font-medium text-teal-600 dark:text-teal-400">
						<T k="auth.signUp.signIn">เข้าสู่ระบบ</T>
					</Link>
				</p>
			</div>
		</div>
	)
}

export default SignUpPage
