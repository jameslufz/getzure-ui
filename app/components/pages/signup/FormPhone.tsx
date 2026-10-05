import { T } from "@/app/i18n/T";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { GoogleSignInButton } from "../../GoogleSignInButton";
import { FormField } from "@/app/components/FormField";
import { OrDivider } from "@/app/components/OrDivider";
import { PHONE_NUMBER_PATTERN } from "@/app/lib/validation";
import { TSendPhoneOtpReturned, TSignupStep } from "@/app/sign-up/page";
import { getResendWindow, TOtpStorage } from "@/app/lib/otp-session";
import { NumericFormat } from "react-number-format";
import { SignupApiError, type TServerErrorKind } from "@/app/lib/signup-errors";

const phoneFormSchema = z.object({
	phoneNumber: z
		.string({ error: "กรุณากรอกหมายเลขเบอร์โทรศัพท์" })
		.regex(PHONE_NUMBER_PATTERN, { error: "รูปแบบเบอร์โทรไม่ถูกต้อง" }),
})

type TFormPhoneProps = {
	isLoading: boolean

	onSendPhoneOtp: (phoneNo: string) => Promise<TSendPhoneOtpReturned>
	onSetPhoneNumber: (phoneNo: string) => void
	onSetOtpRef: (otpRef: string) => void
	onSetResendAvailableAt: (timestamp: number) => void
	onSaveOtpStorage: (otpStorage: TOtpStorage) => void
	onSetStep: (step: TSignupStep) => void

	onSetServerError: (v: TServerErrorKind | null) => void
	onSetLoading: (v: boolean) => void
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
	onSetServerError,
	onSetLoading,
}) => {
	const phoneForm = useForm<TPhoneForm>({
		resolver: zodResolver(phoneFormSchema),
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
		<form onSubmit={phoneForm.handleSubmit(handleRequestOTP)} className="space-y-4" noValidate>
			<FormField
				label={<T k="auth.form.phone">เบอร์โทรศัพท์</T>}
				error={
					phoneForm.formState.errors.phoneNumber && (
						<T k="auth.form.error.invalidPhone">
							{phoneForm.formState.errors.phoneNumber.message ||
								"กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง เช่น +66812345678"}
						</T>
					)
				}
			>
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
							aria-invalid={!!phoneForm.formState.errors.phoneNumber}
							className="input"
						/>
					)}
				/>
			</FormField>

			<button type="submit" disabled={isLoading} className="btn-primary w-full">
				<T k="auth.signUp.sendCode">ยืนยันหมายเลขเบอร์โทรศัพท์</T>
			</button>

			<OrDivider />

			<GoogleSignInButton callbackURL="/sign-up" />
		</form>
	)
}

export default FormPhone
