"use client"

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fingerprint, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/app/lib/auth-client";
import { FormSkeleton } from "@/app/components/skeletons/PageSkeletons";
import { AuthShell } from "@/app/components/AuthShell";
import { FormField } from "@/app/components/FormField";
import { T } from "@/app/i18n/T";
import { getQueryClient } from "@/app/lib/query-client";
import { getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { getRedirectFromLocation } from "@/app/lib/session";
import {
	kindFromAuthClientError,
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { TTwoFactorMethod } from "@/app/lib/two-factor-primary";

type TStepMethod = TTwoFactorMethod | "backup"
type TTwoFactorForm = { code: string }
type TTwoFactorOptions = { methods: TTwoFactorMethod[]; primary: TTwoFactorMethod | null }
type TMethodView = { icon: ReactNode; label: ReactNode }
type TSignInTwoFactorPage = () => ReactNode
type TFetchOptions = (signal?: AbortSignal) => Promise<TTwoFactorOptions | null>

// Any non-ok answer means there is no sign-in waiting for a second step, which is a null result.
const fetchOptions: TFetchOptions = async (signal) => {
	const res = await fetch("/api/auth/two-factor/options", { signal })
	return res.ok ? res.json() : null
}

const METHOD_VIEWS: Record<TTwoFactorMethod, TMethodView> = {
	passkey: {
		icon: <Fingerprint className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.signIn.method.passkey">ใช้ Passkey (ลายนิ้วมือ/ใบหน้า)</T>,
	},
	totp: {
		icon: <ShieldCheck className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.signIn.method.totp">แอปยืนยันตัวตน</T>,
	},
	email: {
		icon: <Mail className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.signIn.method.email">รับรหัสทางอีเมล</T>,
	},
	phone: {
		icon: <Smartphone className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.signIn.method.phone">รับรหัสทาง SMS</T>,
	},
}

type TIsSentCodeMethod = (method: TStepMethod) => boolean

const isSentCodeMethod: TIsSentCodeMethod = (method) => method === "email" || method === "phone"

// Second step of a password sign-in for accounts with two-factor on: it offers the preferred method
// first and keeps the others one tap away. A preferred passkey starts by itself once, and codes by
// email or SMS are only sent when asked.
const SignInTwoFactorPage: TSignInTwoFactorPage = () => {
	const router = useRouter()
	// A new sign-in step is never served from the cache.
	const optionsQuery = useQuery({
		queryKey: queryKeys.twoFactorOptions,
		queryFn: ({ signal }) => fetchOptions(signal),
		staleTime: 0,
		gcTime: 0,
		retry: false,
	})
	const options = optionsQuery.data
	const optionsView = getQueryView(optionsQuery)
	const [chosen, setChosen] = useState<TStepMethod | null | undefined>(undefined)
	const method: TStepMethod | null = chosen === undefined ? (options?.primary ?? null) : chosen
	const autoPasskeyStarted = useRef(false)
	const [codeSent, setCodeSent] = useState(false)
	const [busy, setBusy] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TTwoFactorForm>()

	const finishSignIn = useCallback(() => {
		getQueryClient().clear()
		router.push(getRedirectFromLocation() ?? "/dashboard")
	}, [router])

	const handleChooseMethod = (next: TStepMethod | null) => {
		setChosen(next)
		setCodeSent(false)
		setServerError(null)
		reset()
	}

	// The preferred passkey is started once on arrival; if the browser or the user says no, the button is still there.
	useEffect(() => {
		if (autoPasskeyStarted.current || options?.primary !== "passkey") return

		autoPasskeyStarted.current = true
		authClient.signIn.passkey().then(({ error }) => {
			if (!error) finishSignIn()
		})
	}, [options, finishSignIn])

	const handlePasskey = async () => {
		setServerError(null)
		setBusy(true)
		const { error } = await authClient.signIn.passkey()
		setBusy(false)
		if (error) return setServerError("passkeyFailed")
		finishSignIn()
	}

	const handleSendCode = async () => {
		if (method !== "email" && method !== "phone") return
		setServerError(null)
		setBusy(true)
		try {
			const res = await fetch("/api/two-factor/send-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channel: method }),
			})
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			setCodeSent(true)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		} finally {
			setBusy(false)
		}
	}

	const onSubmit: SubmitHandler<TTwoFactorForm> = async (data) => {
		setServerError(null)
		const { error } =
			method === "totp"
				? await authClient.twoFactor.verifyTotp({ code: data.code })
				: method === "backup"
					? await authClient.twoFactor.verifyBackupCode({ code: data.code })
					: await authClient.twoFactor.verifyOtp({ code: data.code })
		if (error) return setServerError(kindFromAuthClientError(error))
		finishSignIn()
	}

	const otherMethods = options?.methods.filter((option) => option !== method) ?? []
	const canUseBackup = !!options?.methods.includes("totp") && method !== "backup"
	const showCodeForm =
		method === "totp" ||
		method === "backup" ||
		(!!method && isSentCodeMethod(method) && codeSent)

	return (
		<AuthShell
			title={<T k="security.signIn.title">ยืนยันว่าเป็นคุณ</T>}
			subtitle={
				<T k="security.signIn.subtitle">กรอกรหัสยืนยันเพื่อเข้าสู่ระบบให้เสร็จสมบูรณ์</T>
			}
			footer={
				<Link href="/sign-in" className="link">
					<T k="auth.signIn.title">เข้าสู่ระบบ</T>
				</Link>
			}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
				{serverError && (
					<p className="alert-error">
						<T k={SERVER_ERROR_MESSAGES[serverError].key}>
							{SERVER_ERROR_MESSAGES[serverError].th}
						</T>
					</p>
				)}

				{options === null || optionsView === "failed" ? (
					<p className="alert-error">
						<T k="security.signIn.expired">
							หมดเวลาหรือยังไม่ได้กรอกรหัสผ่าน กรุณาเข้าสู่ระบบใหม่อีกครั้ง
						</T>
					</p>
				) : options === undefined ? (
					<FormSkeleton count={1} />
				) : (
					<>
						{method && method !== "backup" && (
							<div className="flex items-center gap-3">
								{METHOD_VIEWS[method].icon}
								<p className="font-medium text-zinc-900 dark:text-zinc-50">
									{METHOD_VIEWS[method].label}
								</p>
								{method === "passkey" && (
									<span className="badge-success">
										<T k="security.recommended">แนะนำ</T>
									</span>
								)}
							</div>
						)}

						{method === "passkey" && (
							<button
								type="button"
								disabled={busy}
								onClick={handlePasskey}
								className="btn-primary w-full"
							>
								<T k="security.signIn.passkeyContinue">ดำเนินการต่อด้วย Passkey</T>
							</button>
						)}

						{method && isSentCodeMethod(method) && !codeSent && (
							<button
								type="button"
								disabled={busy}
								onClick={handleSendCode}
								className="btn-primary w-full"
							>
								<T k="security.signIn.sendCode">ส่งรหัส</T>
							</button>
						)}

						{showCodeForm && (
							<>
								{codeSent && (
									<p className="alert-success">
										<T k="security.signIn.codeSent">เราได้ส่งรหัสให้คุณแล้ว</T>
									</p>
								)}
								<FormField
									label={
										method === "totp" ? (
											<T k="security.signIn.totpCode">
												รหัสจากแอปยืนยันตัวตน
											</T>
										) : method === "backup" ? (
											<T k="security.signIn.backupCode">รหัสสำรอง</T>
										) : (
											<T k="auth.form.otp">รหัสยืนยัน</T>
										)
									}
									error={
										errors.code && (
											<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
										)
									}
								>
									<input
										type="text"
										inputMode={method === "backup" ? "text" : "numeric"}
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
									<T k="security.signIn.verify">ยืนยันและเข้าสู่ระบบ</T>
								</button>
								{codeSent && (
									<button
										type="button"
										disabled={busy}
										onClick={handleSendCode}
										className="link w-full text-center text-sm"
									>
										<T k="security.signIn.resendCode">ส่งรหัสอีกครั้ง</T>
									</button>
								)}
							</>
						)}

						{(otherMethods.length > 0 || canUseBackup) && (
							<div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
								<p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
									<T k="security.signIn.otherMethod">เลือกวิธีอื่น</T>
								</p>
								{otherMethods.map((option) => (
									<button
										key={option}
										type="button"
										onClick={() => handleChooseMethod(option)}
										className="option"
									>
										{METHOD_VIEWS[option].icon}
										<span className="flex-1 font-medium text-zinc-900 dark:text-zinc-50">
											{METHOD_VIEWS[option].label}
										</span>
										{option === "passkey" && (
											<span className="badge-success">
												<T k="security.recommended">แนะนำ</T>
											</span>
										)}
									</button>
								))}
								{canUseBackup && (
									<button
										type="button"
										onClick={() => handleChooseMethod("backup")}
										className="w-full text-center text-sm text-zinc-500 dark:text-zinc-400"
									>
										<T k="security.signIn.method.backup">ใช้รหัสสำรอง</T>
									</button>
								)}
							</div>
						)}
					</>
				)}
			</form>
		</AuthShell>
	)
}

export default SignInTwoFactorPage
