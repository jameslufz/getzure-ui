import { T } from "@/app/i18n/T"
import { zodResolver } from "@hookform/resolvers/zod"
import { ReactNode } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import z from "zod"
import { GoogleSignInButton } from "../../GoogleSignInButton"
import { TOtpStorage, TSendPhoneOtpReturned, TSignupStep } from "@/app/sign-up/page"
import { NumericFormat } from "react-number-format"
import { SignupApiError, type TServerErrorKind } from "@/app/lib/signup-errors"

const phoneFormSchema = z.object({
    phoneNumber: z
        .string({ error: "กรุณากรอกหมายเลขเบอร์โทรศัพท์" })
        .regex(/^(06|08|09)\d{8}$/, { error: "รูปแบบเบอร์โทรไม่ถูกต้อง" }),
})

type TFormPhoneProps = {
    isLoading: boolean;

    onSendPhoneOtp: (phoneNo: string) => Promise<TSendPhoneOtpReturned>
    onSetPhoneNumber: (phoneNo: string) => void;
    onSetOtpRef: (otpRef: string) => void;
    onSetResendAvailableAt: (timestamp: number) => void;
    onSaveOtpStorage: (otpStorage: TOtpStorage) => void;
    onSetStep: (step: TSignupStep) => void;

    fieldClass: (hasError: boolean) => string;
    onSetServerError: (v: TServerErrorKind | null) => void;
    onSetLoading: (v: boolean) => void;
}

type TFormPhone = (props: TFormPhoneProps) => ReactNode
type TPhoneForm = z.infer<typeof phoneFormSchema>

const FormPhone: TFormPhone = ({
    isLoading,
    onSendPhoneOtp,
    onSetPhoneNumber,
    onSetOtpRef,
    onSetResendAvailableAt,
    onSaveOtpStorage,
    onSetStep,
    fieldClass,
    onSetServerError,
    onSetLoading
}) =>
{
    const phoneForm = useForm<TPhoneForm>({
        resolver: zodResolver(phoneFormSchema)
    })

    const handleRequestOTP: SubmitHandler<TPhoneForm> = async (data) => {
        onSetServerError(null)
        onSetLoading(true)
        try {
            const { otpRef } = await onSendPhoneOtp(data.phoneNumber)
            const { now, availableAt } = getResendWindow()
            onSetPhoneNumber(data.phoneNumber)
            onSetOtpRef(otpRef || "")
            onSetResendAvailableAt(availableAt)
            onSaveOtpStorage({
                phoneNumber: data.phoneNumber,
                otpRef: otpRef || "",
                otpSentAt: now,
                resendAvailableAt: availableAt,
            })
            onSetStep("otp")
        } catch (err) {
            onSetServerError(err instanceof SignupApiError ? err.kind : "generic")
        } finally {
            onSetLoading(false)
        }
    }

    return (
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
                disabled={isLoading}
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

            <GoogleSignInButton callbackURL="/sign-up" />
        </form>
    )
}

export default FormPhone

const RESEND_COOLDOWN_SECONDS = 60
const getResendWindow = () => {
    const now = Date.now()
    return { now, availableAt: now + RESEND_COOLDOWN_SECONDS * 1000 }
}