"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";
import FormInfo from "../components/pages/signup/FormInfo";
import FormPhone from "../components/pages/signup/FormPhone";
import FormOTP from "../components/pages/signup/FormOTP";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors";

const fieldClass = (hasError: boolean) => {
	return `w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-hidden focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${
		hasError
			? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
			: "border-zinc-200 focus:border-teal-500 focus:ring-teal-500/20 dark:border-zinc-700"
	}`
}

const OTP_STORAGE_KEY = "getzure:otpSignup"
const OTP_SESSION_TTL_MS = 5 * 60 * 1000

export type TSignupStep = "phone" | "otp" | "info"
export type TOtpStorage = {
	phoneNumber: string
	otpRef: string
	otpSentAt: number
	resendAvailableAt: number
}

type TInfoCheckResponse = { hasSession: boolean; infoComplete: boolean }

const saveOtpStorage = (data: TOtpStorage) => {
	try {
		localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(data))
	} catch {}
}

const readOtpStorage = (): TOtpStorage | null => {
	try {
		const raw = localStorage.getItem(OTP_STORAGE_KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

const clearOtpStorage = () => {
	try {
		localStorage.removeItem(OTP_STORAGE_KEY)
	} catch {}
}

const SignUpPage = () => {
	const router = useRouter()
	const [step, setStep] = useState<TSignupStep>("phone")
	const [checkingSession, setCheckingSession] = useState(true)
	const [phoneNumber, setPhoneNumber] = useState("")
	const [otpRef, setOtpRef] = useState("")
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const [loading, setLoading] = useState(false)
	const [resendAvailableAt, setResendAvailableAt] = useState(0)
	const [resendCooldown, setResendCooldown] = useState(0)

	// Gates the "info" step on a real, server-verified session instead of
	// a URL query param — a param can be typed by anyone, this can't. Runs
	// once on mount: by the time a fresh phone-flow page load could reach
	// this check, there's no session yet, so it's a no-op there; it only
	// actually fires for a reload mid-info-step or a return visit (Google
	// redirect, or an already-complete profile sent straight to dashboard).
	useEffect(() => {
		const applySessionState = (data: TInfoCheckResponse) => {
			if (data.infoComplete) {
				router.push("/dashboard")
				return
			}
			if (data.hasSession) {
				setStep("info")
			}
		}
		const checkSession = async () => {
			try {
				const res = await fetch("/api/info")
				const data: TInfoCheckResponse = await res.json()
				applySessionState(data)
			} catch {
				// treat an unreachable check the same as "no session"
			} finally {
				setCheckingSession(false)
			}
		}
		checkSession()
	}, [router])

	useEffect(() => {
		const restore = (stored: TOtpStorage) => {
			setPhoneNumber(stored.phoneNumber)
			setOtpRef(stored.otpRef)
			setResendAvailableAt(stored.resendAvailableAt)
			setStep("otp")
		}
		const stored = readOtpStorage()
		if (!stored) return
		if (Date.now() - stored.otpSentAt > OTP_SESSION_TTL_MS) {
			clearOtpStorage()
			return
		}
		restore(stored)
	}, [])

	useEffect(() => {
		const tick = () => {
			setResendCooldown(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)))
		}
		tick()
		if (resendAvailableAt <= Date.now()) return
		const interval = setInterval(tick, 1000)
		return () => clearInterval(interval)
	}, [resendAvailableAt])

    const handleSetStep = (step: TSignupStep) => setStep(step)
    const handleSetResendAvailableAt = (n: number) => setResendAvailableAt(n)
    const handleSetOtpRef = (otpRef: string) => setOtpRef(otpRef)
    const handleSetPhoneNumber = (phoneNo: string) => setPhoneNumber(phoneNo)

    const handleSetServerError = (v: TServerErrorKind | null) => setServerError(v)
    const handleSetLoading = (v: boolean) => setLoading(v)

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
						{step === "info" ? (
							<>
								<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
									<T k="auth.signUp.info.title">บอกชื่อของคุณให้เราหน่อย</T>
								</h1>
								<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
									<T k="auth.signUp.info.subtitle">
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
					{checkingSession ? null : (
						<>
							{serverError && (
								<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
									<T k={SERVER_ERROR_MESSAGES[serverError].key}>
										{SERVER_ERROR_MESSAGES[serverError].th}
									</T>
								</p>
							)}

							{
                                step === "info" ? (
                                    <FormInfo
                                        isLoading={loading}
                                        fieldClass={fieldClass}
                                        setServerError={handleSetServerError}
                                        setLoading={handleSetLoading}
                                        clearOtpStorage={clearOtpStorage}
                                    />
                                ) : step === "phone" ? (
                                    <FormPhone
                                        isLoading={loading}
                                        onSendPhoneOtp={sendPhoneOtp}
                                        onSetPhoneNumber={handleSetPhoneNumber}
                                        onSetOtpRef={handleSetOtpRef}
                                        onSetResendAvailableAt={handleSetResendAvailableAt}
                                        onSaveOtpStorage={saveOtpStorage}
                                        onSetStep={handleSetStep}
                                        fieldClass={fieldClass}
                                        onSetServerError={handleSetServerError}
                                        onSetLoading={handleSetLoading}
                                    />
                                ) : (
                                    <FormOTP
                                        isLoading={loading}
                                        phoneNumber={phoneNumber}
                                        otpRef={otpRef}
                                        resendCooldown={resendCooldown}

                                        clearOtpStorage={clearOtpStorage}
                                        onSendPhoneOtp={sendPhoneOtp}
                                        onSetOtpRef={setOtpRef}
                                        onSetResendAvailableAt={setResendAvailableAt}
                                        onSaveOtpStorage={saveOtpStorage}
                                        onSetStep={setStep}
                                        fieldClass={fieldClass}
                                        onSetServerError={setServerError}
                                        onSetLoading={setLoading}
                                    />
                                )
                            }
						</>
					)}
				</div>

				{step !== "info" && (
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

export type TSendPhoneOtpReturned = { message: string; otpRef?: string }
const sendPhoneOtp = async (phoneNumber: string) => {
	const res = await fetch("/api/send-phone-otp", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phoneNumber }),
	})
	if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
	const data = await res.json() as TSendPhoneOtpReturned
	return data
}