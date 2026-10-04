import { T } from "@/app/i18n/T"
import { zodResolver } from "@hookform/resolvers/zod"
import { ReactNode } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import z from "zod"
import { TOtpStorage, TSendPhoneOtpReturned, TSignupStep } from "@/app/sign-up/page"
import { authClient } from "@/app/lib/auth-client"
import { SIGNUP_ERROR_CODE_MAP, SignupApiError, TServerErrorKind } from "@/app/lib/signup-errors"

const RESEND_COOLDOWN_SECONDS = 60
const otpFormSchema = z.object({
    code: z
        .string({ error: "กรุณากรอกรหัส OTP" })
        .min(6, { error: "รหัส OTP ต้องมี 6 หลัก" })
        .max(6, { error: "รหัส OTP ต้องมี 6 หลัก" }),
})

type TOtpForm = z.infer<typeof otpFormSchema>

type TFormOTPProps = {
    isLoading: boolean;
    phoneNumber: string;
    otpRef: string;
    resendCooldown: number;

    clearOtpStorage: () => void;

    onSendPhoneOtp: (phoneNo: string) => Promise<TSendPhoneOtpReturned>
    onSetOtpRef: (otpRef: string) => void;
    onSetResendAvailableAt: (timestamp: number) => void;
    onSaveOtpStorage: (otpStorage: TOtpStorage) => void;
    onSetStep: (step: TSignupStep) => void;

    fieldClass: (hasError: boolean) => string;
    onSetServerError: (v: TServerErrorKind | null) => void;
    onSetLoading: (v: boolean) => void;
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
    fieldClass,
    onSetServerError,
    onSetLoading
}) =>
{
    const otpForm = useForm<TOtpForm>({
        resolver: zodResolver(otpFormSchema)
    })

    const handleVerify: SubmitHandler<TOtpForm> = (data) => {
        onSetServerError(null)
        onSetLoading(true)
        authClient.phoneNumber.verify(
            { phoneNumber, code: data.code },
            {
                onSuccess: () => {
                    onSetLoading(false)
                    clearOtpStorage()
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

    const formatCountdown = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }

    const getResendWindow = () => {
        const now = Date.now()
        return { now, availableAt: now + RESEND_COOLDOWN_SECONDS * 1000 }
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
                        <T k="auth.form.error.required">{otpForm.formState.errors.code.message || "กรุณากรอกข้อมูลนี้"}</T>
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
                <T k="auth.signUp.verify">ยืนยันและเข้าสู่ระบบ</T>
            </button>

            <div className="flex items-center justify-between text-sm">
                <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="font-medium text-teal-600 dark:text-teal-400 disabled:opacity-40"
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