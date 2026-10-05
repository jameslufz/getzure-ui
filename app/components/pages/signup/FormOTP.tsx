import { T } from "@/app/i18n/T";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/app/components/FormField";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { TSendPhoneOtpReturned, TSignupStep } from "@/app/sign-up/page";
import { formatCountdown, getResendWindow, TOtpStorage } from "@/app/lib/otp-session";
import { authClient } from "@/app/lib/auth-client";
import { appendRedirect } from "@/app/lib/session";
import { SIGNUP_ERROR_CODE_MAP, SignupApiError, TServerErrorKind } from "@/app/lib/signup-errors";

const otpFormSchema = z.object({
	code: z
		.string({ error: "กรุณากรอกรหัส OTP" })
		.min(6, { error: "รหัส OTP ต้องมี 6 หลัก" })
		.max(6, { error: "รหัส OTP ต้องมี 6 หลัก" }),
})

type TOtpForm = z.infer<typeof otpFormSchema>

type TFormOTPProps = {
	isLoading: boolean
	phoneNumber: string
	otpRef: string
	resendCooldown: number

	clearOtpStorage: () => void

	onSendPhoneOtp: (phoneNo: string) => Promise<TSendPhoneOtpReturned>
	onSetOtpRef: (otpRef: string) => void
	onSetResendAvailableAt: (timestamp: number) => void
	onSaveOtpStorage: (otpStorage: TOtpStorage) => void
	onSetStep: (step: TSignupStep) => void

	onSetServerError: (v: TServerErrorKind | null) => void
	onSetLoading: (v: boolean) => void
}

type TFormOTP = (props: TFormOTPProps) => ReactNode

const FormOTP: TFormOTP = ({
	isLoading,
	phoneNumber,
	otpRef,
	resendCooldown,

	clearOtpStorage,
	onSendPhoneOtp,
	onSetOtpRef,
	onSetResendAvailableAt,
	onSaveOtpStorage,
	onSetStep,
	onSetServerError,
	onSetLoading,
}) => {
	const router = useRouter()
	const otpForm = useForm<TOtpForm>({
		resolver: zodResolver(otpFormSchema),
	})

	const handleVerify: SubmitHandler<TOtpForm> = (data) => {
		onSetServerError(null)
		onSetLoading(true)
		authClient.phoneNumber.verify(
			{ phoneNumber, code: data.code },
			{
				onSuccess: (ctx) => {
					onSetLoading(false)

					// An existing account with two-factor on has no session yet: the second step comes first.
					if (ctx.data?.twoFactorRedirect) {
						clearOtpStorage()
						router.push(appendRedirect("/sign-in/two-factor"))
						return
					}

					onSetStep("info")
				},
				onError: (ctx) => {
					onSetLoading(false)
					onSetServerError(SIGNUP_ERROR_CODE_MAP[ctx.error.code] || "generic")
				},
			},
		)
	}

	const handleChangeNumber = () => {
		clearOtpStorage()
		onSetResendAvailableAt(0)
		onSetStep("phone")
		onSetServerError(null)
		otpForm.reset()
	}

	const handleResendCode = async () => {
		try {
			const { otpRef } = await onSendPhoneOtp(phoneNumber)
			const { now, availableAt } = getResendWindow()
			onSetOtpRef(otpRef || "")
			onSetResendAvailableAt(availableAt)
			onSaveOtpStorage({
				phoneNumber,
				otpRef: otpRef || "",
				otpSentAt: now,
				resendAvailableAt: availableAt,
			})
		} catch (err) {
			onSetServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	return (
		<form onSubmit={otpForm.handleSubmit(handleVerify)} className="space-y-4" noValidate>
			<p className="text-sm text-zinc-500 dark:text-zinc-400">
				<T k="auth.signUp.otpSentTo">เราได้ส่งรหัสไปที่</T>{" "}
				<span className="font-medium text-zinc-900 dark:text-zinc-50">{phoneNumber}</span>{" "}
				<span className="text-zinc-400 dark:text-zinc-500">(Ref: {otpRef})</span>
			</p>

			<FormField
				label={<T k="auth.form.otp">รหัสยืนยัน</T>}
				error={
					otpForm.formState.errors.code && (
						<T k="auth.form.error.required">
							{otpForm.formState.errors.code.message || "กรุณากรอกข้อมูลนี้"}
						</T>
					)
				}
			>
				<input
					type="text"
					inputMode="numeric"
					autoFocus
					{...otpForm.register("code", { required: true })}
					aria-invalid={!!otpForm.formState.errors.code}
					className="input"
				/>
			</FormField>

			<button type="submit" disabled={isLoading} className="btn-primary w-full">
				<T k="auth.signUp.verify">ยืนยันและเข้าสู่ระบบ</T>
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
						className="text-zinc-500 dark:text-zinc-400 hover:text-teal-200"
					>
						<T k="auth.signUp.resendCode">ส่งรหัสอีกครั้ง</T>
					</button>
				)}
			</div>
		</form>
	)
}

export default FormOTP
