"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/app/components/AuthShell";
import { getRedirectFromLocation, serviceFetch } from "@/app/lib/session";
import { T } from "@/app/i18n/T";
import FormInfo from "../components/pages/signup/FormInfo";
import FormPhone from "../components/pages/signup/FormPhone";
import FormOTP from "../components/pages/signup/FormOTP";
import {
	createOtpStorage,
	isOtpSessionExpired,
	OTP_SESSION_TTL_MS,
	TOtpStorage,
	useSecondsUntil,
} from "@/app/lib/otp-session"
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"

const otpStorage = createOtpStorage("getzure:otpSignup")
const { save: saveOtpStorage, read: readOtpStorage, clear: clearOtpStorage } = otpStorage

export type TSignupStep = "phone" | "otp" | "info"
type TInfoCheckResponse = { hasSession: boolean; infoComplete: boolean }

type TResumeOtpStep = (stored: TOtpStorage) => void
type THandleSetStep = (step: TSignupStep) => void
type THandleSetResendAvailableAt = (timestamp: number) => void
type THandleSetOtpRef = (otpRef: string) => void
type THandleSetPhoneNumber = (phoneNo: string) => void
type THandleSetServerError = (kind: TServerErrorKind | null) => void
type THandleSetLoading = (isLoading: boolean) => void

const SignUpPage = () => {
	const router = useRouter()
	const [step, setStep] = useState<TSignupStep>("phone")
	const [checkingSession, setCheckingSession] = useState(true)
	const [phoneNumber, setPhoneNumber] = useState("")
	const [otpRef, setOtpRef] = useState("")
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const [loading, setLoading] = useState(false)
	const [resendAvailableAt, setResendAvailableAt] = useState(0)
	const resendCooldown = useSecondsUntil(resendAvailableAt)

	useEffect(() => {
		const stored = readOtpStorage()
		const otpExpired = !!stored && isOtpSessionExpired(stored)

		const resumeOtpStep: TResumeOtpStep = (stored) => {
			setPhoneNumber(stored.phoneNumber)
			setOtpRef(stored.otpRef)
			setResendAvailableAt(stored.resendAvailableAt)
			setStep("otp")
		}
		if (stored && !otpExpired) {
			resumeOtpStep(stored)
		}

		const checkSession = async () => {
			try {
				const res = await serviceFetch("/info")
				const data: TInfoCheckResponse = await res.json()
				if (data.infoComplete) {
					router.push(getRedirectFromLocation() ?? "/dashboard")
					return
				}

				if (data.hasSession && !otpExpired) {
					setStep("info")
				}
			} catch {
			} finally {
				setCheckingSession(false)
			}
		}
		checkSession()
	}, [router])

	// Auto-bounce to the phone step once the 5-minute OTP window expires, even without a reload.
	useEffect(() => {
		if (step !== "info") return
		const stored = readOtpStorage()
		if (!stored) return

		const remainingMs = OTP_SESSION_TTL_MS - (Date.now() - stored.otpSentAt)
		const expire = () => {
			clearOtpStorage()
			setStep("phone")
		}
		if (remainingMs <= 0) {
			expire()
			return
		}
		const timer = setTimeout(expire, remainingMs)
		return () => clearTimeout(timer)
	}, [step])

	const handleSetStep: THandleSetStep = (step) => setStep(step)
	const handleSetResendAvailableAt: THandleSetResendAvailableAt = (timestamp) =>
		setResendAvailableAt(timestamp)
	const handleSetOtpRef: THandleSetOtpRef = (otpRef) => setOtpRef(otpRef)
	const handleSetPhoneNumber: THandleSetPhoneNumber = (phoneNo) => setPhoneNumber(phoneNo)

	const handleSetServerError: THandleSetServerError = (kind) => setServerError(kind)
	const handleSetLoading: THandleSetLoading = (isLoading) => setLoading(isLoading)

	const title = checkingSession ? (
		<span className="mx-auto block h-6 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
	) : step === "info" ? (
		<T k="auth.signUp.info.title">บอกชื่อของคุณให้เราหน่อย</T>
	) : (
		<T k="auth.signUp.title">สร้างบัญชีใหม่</T>
	)

	const subtitle = checkingSession ? (
		<span className="mx-auto mt-1 block h-4 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
	) : step === "info" ? (
		<T k="auth.signUp.info.subtitle">ขั้นตอนสุดท้ายก่อนเข้าแดชบอร์ด</T>
	) : (
		<T k="auth.signUp.subtitle">เริ่มรับชำระเงินด้วย Getzure</T>
	)

	const footer = !checkingSession && step !== "info" && (
		<>
			<T k="auth.signUp.haveAccount">มีบัญชีอยู่แล้ว?</T>{" "}
			<Link href="/sign-in" className="link">
				<T k="auth.signUp.signIn">เข้าสู่ระบบ</T>
			</Link>
		</>
	)

	return (
		<AuthShell title={title} subtitle={subtitle} footer={footer}>
			<div className="card space-y-4">
				{checkingSession ? (
					<div className="space-y-4">
						<div className="h-10 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
						<div className="h-10 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
						<div className="h-10 w-full animate-pulse rounded-md bg-teal-100 dark:bg-teal-900/40" />
					</div>
				) : (
					<>
						{serverError && (
							<p className="alert-error">
								<T k={SERVER_ERROR_MESSAGES[serverError].key}>
									{SERVER_ERROR_MESSAGES[serverError].th}
								</T>
							</p>
						)}

						{step === "info" ? (
							<FormInfo
								isLoading={loading}
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
								onSetServerError={setServerError}
								onSetLoading={setLoading}
							/>
						)}
					</>
				)}
			</div>
		</AuthShell>
	)
}

export default SignUpPage

export type TSendPhoneOtpReturned = { message: string; otpRef?: string }
type TSendPhoneOtp = (phoneNumber: string) => Promise<TSendPhoneOtpReturned>

const sendPhoneOtp: TSendPhoneOtp = async (phoneNumber) => {
	const res = await fetch("/api/send-phone-otp", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phoneNumber }),
	})
	if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
	const data = (await res.json()) as TSendPhoneOtpReturned
	return data
}
