"use client"

import { useState } from "react";
import Link from "next/link";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/app/lib/auth-client";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";
import { NumericFormat } from "react-number-format";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormProfile from "../components/pages/signup/FormProfile";

const fieldClass = (hasError: boolean) => {
	return `w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-hidden focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${
		hasError
			? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
			: "border-zinc-200 focus:border-teal-500 focus:ring-teal-500/20 dark:border-zinc-700"
	}`
}

const phoneFormSchema = z.object({
	phoneNumber: z
		.string({ error: "กรุณากรอกหมายเลขเบอร์โทรศัพท์" })
		.regex(/^(06|08|09)\d{8}$/, { error: "รูปแบบเบอร์โทรไม่ถูกต้อง" }),
})

const otpFormSchema = z.object({
	code: z
		.string()
		.min(6, { error: "รหัส OTP ต้องมี 6 หลัก" })
		.max(6, { error: "รหัส OTP ต้องมี 6 หลัก" }),
})

const profileFormSchema = z.object({
	firstname: z.string({ error: "กรุณากรอกชื่อจริง" }).min(1, { error: "กรุณากรอกชื่อจริง" }),
	middlename: z.string().optional(),
	lastname: z.string({ error: "กรุณากรอกนามสกุล" }).min(1, { error: "กรุณากรอกนามสกุล" }),
})

export type TPhoneForm = z.infer<typeof phoneFormSchema>
export type TOtpForm = z.infer<typeof otpFormSchema>
export type TProfileForm = z.infer<typeof profileFormSchema>

const sendPhoneOtp = async (phoneNumber: string) => {
	const res = await fetch("/api/send-phone-otp", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phoneNumber }),
	})
	if (!res.ok) throw new Error("failed to send otp")
	const data: { message: string; otpRef?: string } = await res.json()
	return data
}

const SignUpPage = () => {
	const [step, setStep] = useState<"phone" | "otp" | "profile">("phone")
	const [phoneNumber, setPhoneNumber] = useState("")
	const [otpRef, setOtpRef] = useState("")
	const [serverError, setServerError] = useState(false)
	const [loading, setLoading] = useState(false)

    const handleSetServerError = (v: boolean) => setServerError(v)
    const handleSetLoading = (v: boolean) => setLoading(v)

	const phoneForm = useForm<TPhoneForm>({ resolver: zodResolver(phoneFormSchema) })
	const otpForm = useForm<TOtpForm>({ resolver: zodResolver(otpFormSchema) })
	const profileForm = useForm<TProfileForm>({ resolver: zodResolver(profileFormSchema) })

	const handleRequestOTP: SubmitHandler<TPhoneForm> = async (data) => {
		setServerError(false)
		setLoading(true)
		try {
			const { otpRef } = await sendPhoneOtp(data.phoneNumber)
			setPhoneNumber(data.phoneNumber)
			setOtpRef(otpRef || "")
			setStep("otp")
		} catch {
			setServerError(true)
		} finally {
			setLoading(false)
		}
	}

	const handleVerify: SubmitHandler<TOtpForm> = (data) => {
		setServerError(false)
		setLoading(true)
		authClient.phoneNumber.verify(
			{ phoneNumber, code: data.code },
			{
				onSuccess: () => {
					setLoading(false)
					setStep("profile")
				},
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

	const handleResendCode = async () => {
		try {
			const { otpRef } = await sendPhoneOtp(phoneNumber)
			setOtpRef(otpRef || "")
		} catch {
			setServerError(true)
		}
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
						{step === "profile" ? (
							<>
								<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
									<T k="auth.signUp.profile.title">บอกชื่อของคุณให้เราหน่อย</T>
								</h1>
								<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
									<T k="auth.signUp.profile.subtitle">
										ขั้นตอนสุดท้ายก่อนเข้าแดชบอร์ด
									</T>
								</p>
							</>
						) : (
							<>
								<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
									<T k="auth.signUp.title">สร้างบัญชีใหม่</T>
								</h1>
								<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
									<T k="auth.signUp.subtitle">เริ่มรับชำระเงินด้วย Getzure</T>
								</p>
							</>
						)}
					</div>
				</div>

				<div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
					{serverError && (
						<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
							<T k="auth.error.generic">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</T>
						</p>
					)}

					{step === "profile" ? (
                        <FormProfile
                            isLoading={loading}
                            profileForm={profileForm}
                            fieldClass={fieldClass}
                            setServerError={handleSetServerError}
                            setLoading={handleSetLoading}
                        />
					) : step === "phone" ? (
						<form
							onSubmit={phoneForm.handleSubmit(handleRequestOTP)}
							className="space-y-4"
							noValidate
						>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									<T k="auth.form.phone">เบอร์โทรศัพท์</T>
								</label>
								<Controller
									name="phoneNumber"
									control={phoneForm.control}
									render={({ field }) => (
										<NumericFormat
											type="text"
											allowLeadingZeros
											allowNegative={false}
											maxLength={10}
											placeholder="0812345678"
											value={field.value}
											onValueChange={(values) => field.onChange(values.value)}
											onBlur={field.onBlur}
											className={fieldClass(
												!!phoneForm.formState.errors.phoneNumber,
											)}
										/>
									)}
								/>
								{phoneForm.formState.errors.phoneNumber && (
									<p className="mt-1 text-xs text-rose-500">
										<T k="auth.form.error.invalidPhone">
											{phoneForm.formState.errors.phoneNumber.message ||
												"กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง เช่น +66812345678"}
										</T>
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
							>
								<T k="auth.signUp.sendCode">ยืนยันหมายเลขเบอร์โทรศัพท์</T>
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
							onSubmit={otpForm.handleSubmit(handleVerify)}
							className="space-y-4"
							noValidate
						>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								<T k="auth.signUp.otpSentTo">เราได้ส่งรหัสไปที่</T>{" "}
								<span className="font-medium text-zinc-900 dark:text-zinc-50">
									{phoneNumber}
								</span>{" "}
								<span className="text-zinc-400 dark:text-zinc-500">
									(Ref: {otpRef})
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

				{step !== "profile" && (
					<p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
						<T k="auth.signUp.haveAccount">มีบัญชีอยู่แล้ว?</T>{" "}
						<Link href="/sign-in" className="font-medium text-teal-600 dark:text-teal-400">
							<T k="auth.signUp.signIn">เข้าสู่ระบบ</T>
						</Link>
					</p>
				)}
			</div>
		</div>
	)
}

export default SignUpPage
