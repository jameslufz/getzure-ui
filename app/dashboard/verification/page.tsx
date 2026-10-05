"use client"

import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { T } from "@/app/i18n/T";
import { FormField } from "@/app/components/FormField";
import { PageHeader } from "@/app/components/PageHeader";
import { DatePicker } from "@/app/components/DatePicker";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { clientServiceUrl } from "@/app/lib/client-service";
import { serviceFetch } from "@/app/lib/session";
import {
	ADDRESS_TEXT_PATTERN,
	AREA_NAME_MAX_LENGTH,
	HOUSE_NO_MAX_LENGTH,
	STREET_MAX_LENGTH,
	isValidNationalId,
	KYC_IMAGE_MAX_BYTES,
	KYC_IMAGE_MIME_TYPES,
	POSTCODE_PATTERN,
} from "@/app/lib/validation"

type TVerificationStatus = "none" | "pending" | "verified"

type TVerificationInfo = {
	status: TVerificationStatus
	personalIdLast4?: string
	personalIdExp?: string
	hasImage?: boolean
}

type TVerificationForm = {
	personalId: string
	personalIdExp: string
	houseNo: string
	streetAddr: string
	subdistrict: string
	district: string
	province: string
	postcode: string
	idCardPhoto: FileList
}

type TAddressFieldName = "houseNo" | "streetAddr" | "subdistrict" | "district" | "province"
type TAddressField = { name: TAddressFieldName; label: React.ReactNode; maxLength: number }

type TVerificationPage = () => React.ReactNode

// YYYY-MM-DD for the date input's `min`, so an already-expired card can't be picked.
const today = () => new Date().toLocaleDateString("en-CA")

const ADDRESS_FIELDS: TAddressField[] = [
	{
		name: "houseNo",
		label: <T k="verification.form.houseNo">บ้านเลขที่</T>,
		maxLength: HOUSE_NO_MAX_LENGTH,
	},
	{
		name: "streetAddr",
		label: <T k="verification.form.streetAddr">ชื่ออาคาร/ถนน</T>,
		maxLength: STREET_MAX_LENGTH,
	},
	{
		name: "subdistrict",
		label: <T k="verification.form.subdistrict">แขวง/ตำบล</T>,
		maxLength: AREA_NAME_MAX_LENGTH,
	},
	{
		name: "district",
		label: <T k="verification.form.district">เขต/อำเภอ</T>,
		maxLength: AREA_NAME_MAX_LENGTH,
	},
	{
		name: "province",
		label: <T k="verification.form.province">จังหวัด</T>,
		maxLength: AREA_NAME_MAX_LENGTH,
	},
]

const VerificationPage: TVerificationPage = () => {
	const [info, setInfo] = useState<TVerificationInfo | null>(null)
	const [version, setVersion] = useState(0)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const [submitted, setSubmitted] = useState(false)
	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TVerificationForm>()

	useEffect(() => {
		const loadInfo = async () => {
			try {
				const res = await serviceFetch("/verification")
				if (res.ok) setInfo(await res.json())
			} catch {}
		}
		loadInfo()
	}, [version])

	const onSubmit: SubmitHandler<TVerificationForm> = async (data) => {
		setServerError(null)
		setSubmitted(false)

		const formData = new FormData()
		formData.append("personalId", data.personalId)
		formData.append("personalIdExp", data.personalIdExp)
		ADDRESS_FIELDS.forEach(({ name }) => formData.append(name, data[name]))
		formData.append("postcode", data.postcode)
		formData.append("idCardPhoto", data.idCardPhoto[0])

		try {
			// No Content-Type header: the browser adds the multipart boundary itself.
			const res = await serviceFetch("/verification", { method: "POST", body: formData })
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			reset()
			setSubmitted(true)
			setVersion((current) => current + 1)
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		}
	}

	const validatePhoto = (files: FileList) => {
		const file = files[0]
		return (
			!!file && KYC_IMAGE_MIME_TYPES.includes(file.type) && file.size <= KYC_IMAGE_MAX_BYTES
		)
	}

	if (info?.status === "verified") {
		return (
			<div className="mx-auto max-w-xl space-y-6">
				<PageHeader
					title={<T k="verification.title">การยืนยันตัวตน</T>}
					subtitle={
						<T k="verification.subtitle">
							ยืนยันตัวตนด้วยบัตรประชาชนเพื่อใช้งานได้เต็มรูปแบบ
						</T>
					}
				/>
				<p className="alert-success">
					<T k="verification.verified">บัญชีของคุณยืนยันตัวตนเรียบร้อยแล้ว</T>
				</p>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<PageHeader
				title={<T k="verification.title">การยืนยันตัวตน</T>}
				subtitle={
					<T k="verification.subtitle">
						ยืนยันตัวตนด้วยบัตรประชาชนเพื่อใช้งานได้เต็มรูปแบบ
					</T>
				}
			/>

			{info?.status === "pending" && (
				<div className="card space-y-3">
					<p className="alert-success">
						<T k="verification.pending">
							ส่งข้อมูลแล้ว กำลังรอการตรวจสอบ
							คุณสามารถส่งข้อมูลใหม่เพื่อแทนที่ข้อมูลเดิมได้
						</T>
					</p>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						<T k="verification.pending.idLast4">เลขบัตรประชาชนที่ส่ง</T>: •••••••••{" "}
						{info.personalIdLast4}
					</p>
					{info.hasImage && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={`${clientServiceUrl("/verification/image")}?v=${version}`}
							alt=""
							className="max-h-56 rounded-md border border-zinc-200 object-contain dark:border-zinc-700"
						/>
					)}
				</div>
			)}

			<form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
				{serverError && (
					<p className="alert-error">
						<T k={SERVER_ERROR_MESSAGES[serverError].key}>
							{SERVER_ERROR_MESSAGES[serverError].th}
						</T>
					</p>
				)}
				{submitted && (
					<p className="alert-success">
						<T k="verification.submitted">ส่งข้อมูลเรียบร้อยแล้ว กำลังรอการตรวจสอบ</T>
					</p>
				)}

				<FormField
					required
					label={<T k="verification.form.personalId">เลขบัตรประชาชน</T>}
					error={
						errors.personalId && (
							<T k="verification.form.error.personalId">เลขบัตรประชาชนไม่ถูกต้อง</T>
						)
					}
				>
					<input
						type="text"
						inputMode="numeric"
						maxLength={13}
						autoComplete="off"
						placeholder="1234567890123"
						{...register("personalId", {
							required: true,
							validate: isValidNationalId,
							setValueAs: (value: string) => value.replace(/\D/g, ""),
						})}
						aria-invalid={!!errors.personalId}
						className="input"
					/>
				</FormField>

				<FormField
					required
					label={<T k="verification.form.personalIdExp">วันหมดอายุบัตร</T>}
					error={
						errors.personalIdExp && (
							<T k="verification.form.error.personalIdExp">
								กรุณาระบุวันหมดอายุที่ยังไม่หมดอายุ
							</T>
						)
					}
				>
					<Controller
						name="personalIdExp"
						control={control}
						rules={{ required: true, validate: (value) => value >= today() }}
						render={({ field }) => (
							<DatePicker
								value={field.value ?? ""}
								onChange={field.onChange}
								minDate={today()}
								invalid={!!errors.personalIdExp}
							/>
						)}
					/>
				</FormField>

				{ADDRESS_FIELDS.map(({ name, label, maxLength }) => (
					<FormField
						key={name}
						required
						label={label}
						error={
							errors[name] && <T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
						}
					>
						<input
							type="text"
							maxLength={maxLength}
							{...register(name, {
								required: true,
								setValueAs: (value: string) => value.trim(),
								pattern: ADDRESS_TEXT_PATTERN,
							})}
							aria-invalid={!!errors[name]}
							className="input"
						/>
					</FormField>
				))}

				<FormField
					required
					label={<T k="verification.form.postcode">รหัสไปรษณีย์</T>}
					error={
						errors.postcode && (
							<T k="verification.form.error.postcode">
								รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก
							</T>
						)
					}
				>
					<input
						type="text"
						inputMode="numeric"
						maxLength={5}
						{...register("postcode", { required: true, pattern: POSTCODE_PATTERN })}
						aria-invalid={!!errors.postcode}
						className="input"
					/>
				</FormField>

				<FormField
					required
					label={<T k="verification.form.photo">รูปถ่ายคู่บัตรประชาชน</T>}
					hint={
						<T k="verification.form.photoHint">
							ถ่ายรูปตัวคุณถือบัตรประชาชน ให้เห็นหน้าและข้อมูลบนบัตรชัดเจน (JPEG, PNG
							หรือ WebP ไม่เกิน 5 MB)
						</T>
					}
					error={
						errors.idCardPhoto && (
							<T k="verification.form.error.photo">
								กรุณาเลือกรูปภาพ JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB
							</T>
						)
					}
				>
					<input
						type="file"
						accept={KYC_IMAGE_MIME_TYPES.join(",")}
						{...register("idCardPhoto", { validate: validatePhoto })}
						aria-invalid={!!errors.idCardPhoto}
						className="input"
					/>
				</FormField>

				<button type="submit" disabled={isSubmitting} className="btn-primary w-full">
					<T k="verification.submit">ส่งข้อมูลเพื่อยืนยันตัวตน</T>
				</button>
			</form>
		</div>
	)
}

export default VerificationPage
