import { ReactNode, useState } from "react";
import QRCode from "react-qr-code";
import { SubmitHandler, useForm } from "react-hook-form";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { authClient } from "@/app/lib/auth-client";
import { TSecurityStatus } from "@/app/hooks/useSecurityStatus";
import copy from "@/app/lib/copy";
import { clearReauth } from "@/app/lib/reauth";
import {
	kindFromAuthClientError,
	SERVER_ERROR_MESSAGES,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { FactorCard } from "./FactorCard";
import { FactorToggleForm } from "./FactorToggleForm";

type TAuthenticatorCardProps = { status: TSecurityStatus; password: string; onChanged: () => void }
type TAuthenticatorCard = (props: TAuthenticatorCardProps) => ReactNode
type TTotpSetup = { uri: string; secret: string; backupCodes: string[] }
type TTotpForm = { code: string }

export const AuthenticatorCard: TAuthenticatorCard = ({ status, password, onChanged }) => {
	const [setup, setSetup] = useState<TTotpSetup | null>(null)
	const [copied, setCopied] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TTotpForm>()

	// Step 1: a secret is generated for the app (it isn't active until step 2).
	const handleStartSetup = async () => {
		setServerError(null)
		const { data: result, error } = await authClient.twoFactor.enable({ password })

		if (error || result?.method !== "totp") {
			// A wrong remembered password means it changed elsewhere: ask for it again.
			if (error?.code === "INVALID_PASSWORD") clearReauth()
			return setServerError(kindFromAuthClientError(error))
		}

		const secret = new URL(result.totpURI).searchParams.get("secret") ?? ""
		setSetup({ uri: result.totpURI, secret, backupCodes: result.backupCodes })
	}

	// Step 2: a code from the app proves it was set up correctly, and only then is it turned on.
	const handleConfirm: SubmitHandler<TTotpForm> = async (data) => {
		const { error } = await authClient.twoFactor.verifyTotp({ code: data.code })
		if (error) return setServerError(kindFromAuthClientError(error))
		setSetup(null)
		reset()
		onChanged()
	}

	const onSubmit: SubmitHandler<TTotpForm> = async (data) => {
		setServerError(null)
		return handleConfirm(data)
	}

	const handleCopyCodes = () => {
		if (!setup) return
		copy(setup.backupCodes.join("\n"))
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const handleCancel = () => {
		setSetup(null)
		setServerError(null)
		reset()
	}

	return (
		<FactorCard
			title={<T k="security.twoFactor.totp.title">แอปยืนยันตัวตน (Google Authenticator)</T>}
			subtitle={
				<T k="security.twoFactor.totp.subtitle">
					ใช้รหัส 6 หลักจากแอปยืนยันตัวตนทุกครั้งที่เข้าสู่ระบบ ใช้ได้แม้ไม่มีสัญญาณมือถือ
				</T>
			}
			enabled={status.totpEnabled}
		>
			{status.totpEnabled ? (
				<FactorToggleForm
					factor="totp"
					enabled
					hasPassword={status.hasPassword}
					password={password}
					onChanged={onChanged}
				/>
			) : !status.hasPassword ? (
				<FactorToggleForm
					factor="totp"
					enabled={false}
					hasPassword={false}
					password={password}
					onChanged={onChanged}
				/>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
					{serverError && (
						<p className="alert-error">
							<T k={SERVER_ERROR_MESSAGES[serverError].key}>
								{SERVER_ERROR_MESSAGES[serverError].th}
							</T>
						</p>
					)}

					{setup ? (
						<>
							<p className="text-sm text-zinc-600 dark:text-zinc-300">
								<T k="security.twoFactor.totp.scan">
									สแกน QR code นี้ด้วยแอป Google Authenticator
								</T>
							</p>
							<div className="inline-block rounded-md bg-white p-3">
								<QRCode value={setup.uri} size={160} />
							</div>
							<div>
								<p className="label">
									<T k="security.twoFactor.totp.manual">
										หรือกรอกรหัสนี้ในแอปด้วยตัวเอง
									</T>
								</p>
								<code className="block rounded-md bg-zinc-100 px-3 py-2 text-sm break-all text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
									{setup.secret}
								</code>
							</div>

							<div>
								<div className="flex items-center justify-between">
									<p className="label !mb-0">
										<T k="security.twoFactor.totp.backup">รหัสสำรอง</T>
									</p>
									<button
										type="button"
										onClick={handleCopyCodes}
										className="link text-sm"
									>
										{copied ? (
											<T k="security.twoFactor.totp.copied">คัดลอกแล้ว</T>
										) : (
											<T k="security.twoFactor.totp.copy">คัดลอกรหัส</T>
										)}
									</button>
								</div>
								<ul className="mt-1.5 grid grid-cols-2 gap-1.5 font-mono text-sm text-zinc-800 dark:text-zinc-200">
									{setup.backupCodes.map((code) => (
										<li
											key={code}
											className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
										>
											{code}
										</li>
									))}
								</ul>
								<p className="field-hint">
									<T k="security.twoFactor.totp.backupHint">
										บันทึกรหัสเหล่านี้ไว้ตอนนี้
										แต่ละรหัสใช้ได้ครั้งเดียวเมื่อเข้าแอปไม่ได้ และจะไม่แสดงอีก
									</T>
								</p>
							</div>

							<FormField
								label={<T k="security.twoFactor.totp.code">รหัสจากแอป</T>}
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
									maxLength={6}
									{...register("code", { required: true, pattern: /^\d{6}$/ })}
									aria-invalid={!!errors.code}
									className="input"
								/>
							</FormField>
							<div className="flex items-center gap-4">
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-primary"
								>
									<T k="security.twoFactor.totp.confirm">ยืนยันและเปิดใช้งาน</T>
								</button>
								<button
									type="button"
									onClick={handleCancel}
									className="text-sm text-zinc-500 dark:text-zinc-400"
								>
									<T k="security.twoFactor.totp.cancel">ยกเลิก</T>
								</button>
							</div>
						</>
					) : (
						<button type="button" onClick={handleStartSetup} className="btn-primary">
							<T k="security.twoFactor.totp.setup">ตั้งค่า</T>
						</button>
					)}
				</form>
			)}
		</FactorCard>
	)
}
