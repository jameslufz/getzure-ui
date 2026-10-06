"use client"

import { ChangeEventHandler, ReactNode, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Camera, IdCard, Pencil } from "lucide-react";
import { T } from "@/app/i18n/T";
import { AvatarCropper } from "@/app/components/AvatarCropper";
import { AvatarContent } from "@/app/components/AvatarContent";
import { BankEditForm } from "@/app/components/BankEditForm";
import { Breadcrumb, PERSONAL_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { QueryNotice } from "@/app/components/QueryNotice";
import { useInvalidate } from "@/app/hooks/useInvalidate";
import { ProfileSkeleton } from "@/app/components/skeletons/PageSkeletons";
import { VerifiedMark } from "@/app/components/VerifiedMark";
import { BANK_LABELS } from "@/app/lib/banks";
import { parseApiErrorKind, SignupApiError } from "@/app/lib/signup-errors";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { serviceFetch } from "@/app/lib/session";
import { showToast } from "@/app/lib/toast";
import {
	PRODUCT_IMAGE_EXTENSIONS,
	PRODUCT_IMAGE_MAX_BYTES,
	PRODUCT_IMAGE_MIME_TYPES,
	TBankCode,
} from "@/app/lib/validation"

type TProfileStatus = "none" | "pending" | "verified" | "rejected"
type TProfileAddress = {
	houseNo: string
	street: string
	subdistrict: string
	district: string
	province: string
	postcode: string
}
type TProfile = {
	nameTh: string
	nameEn: string
	bank: TBankCode | null
	accountName: string
	bankAccountMask?: string
	status: TProfileStatus
	official: boolean
	imageVersion?: string
	rejectReason?: string | null
	personalIdMask?: string
	personalIdExp?: string
	address?: TProfileAddress
}
type TUploadPhoto = (file: File) => Promise<void>
type TProfilePage = () => ReactNode
type TRowProps = { label: ReactNode; children: ReactNode }
type TRow = (props: TRowProps) => ReactNode
type TStatusBadgeProps = { status: TProfileStatus }
type TStatusBadge = (props: TStatusBadgeProps) => ReactNode
type TJoinAddress = (address: TProfileAddress) => string
type TIsAllowedPhoto = (file: File) => boolean

const isAllowedPhoto: TIsAllowedPhoto = (file) => {
	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
	return (
		PRODUCT_IMAGE_EXTENSIONS.includes(extension) &&
		(file.type === "" || PRODUCT_IMAGE_MIME_TYPES.includes(file.type))
	)
}

const joinAddress: TJoinAddress = (address) => {
	const parts = [
		address.houseNo,
		address.street,
		address.subdistrict,
		address.district,
		address.province,
		address.postcode,
	]
	return parts.filter(Boolean).join(" ")
}

const Row: TRow = ({ label, children }) => {
	return (
		<div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
			<dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
			<dd className="text-sm text-zinc-900 sm:col-span-2 dark:text-zinc-50">
				{children || "-"}
			</dd>
		</div>
	)
}

const StatusBadge: TStatusBadge = ({ status }) => {
	if (status === "verified") {
		return (
			<span className="badge-success">
				<T k="profile.status.verified">ยืนยันตัวตนแล้ว</T>
			</span>
		)
	}
	if (status === "rejected") {
		return (
			<span className="badge-danger">
				<T k="profile.status.rejected">ไม่ผ่านการตรวจสอบ</T>
			</span>
		)
	}
	if (status === "pending") {
		return (
			<span className="badge-warning">
				<T k="profile.status.pending">รอตรวจสอบ</T>
			</span>
		)
	}
	return (
		<span className="badge-danger">
			<T k="profile.status.none">ยังไม่ยืนยันตัวตน</T>
		</span>
	)
}

const uploadPhoto: TUploadPhoto = async (file) => {
	const formData = new FormData()
	formData.append("image", file)
	const res = await serviceFetch("/profile/image", { method: "POST", body: formData })
	if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
}

const ProfilePage: TProfilePage = () => {
	const { afterProfileChange } = useInvalidate()
	const [editingBank, setEditingBank] = useState(false)
	const [picked, setPicked] = useState<File | null>(null)
	const fileInput = useRef<HTMLInputElement>(null)

	const query = useQuery({
		queryKey: queryKeys.profile,
		queryFn: ({ signal }) => fetchServiceJson<TProfile>("/profile", signal),
	})
	const { data: profile } = query
	const queryView = getQueryView(query)

	const uploadMutation = useMutation({ mutationFn: uploadPhoto, onSuccess: afterProfileChange })
	const uploading = uploadMutation.isPending

	const handlePick: ChangeEventHandler<HTMLInputElement> = (event) => {
		const file = event.target.files?.[0]
		// Clearing the input lets the same file be picked again.
		event.target.value = ""
		if (!file) return

		if (!isAllowedPhoto(file) || file.size > PRODUCT_IMAGE_MAX_BYTES) {
			showToast(<T k="profile.photoHint">jpg, jpeg, png, webp หรือ avif ไม่เกิน 5 MB</T>)
			return
		}
		setPicked(file)
	}

	const handleUpload = async (cropped: File) => {
		try {
			await uploadMutation.mutateAsync(cropped)
			setPicked(null)
			showToast(<T k="profile.photoSaved">เปลี่ยนรูปโปรไฟล์แล้ว</T>)
		} catch {
			showToast(<T k="profile.photoHint">jpg, jpeg, png, webp หรือ avif ไม่เกิน 5 MB</T>)
		}
	}

	const handleBankSaved = () => {
		setEditingBank(false)
		showToast(<T k="profile.bankSaved">เปลี่ยนบัญชีธนาคารแล้ว</T>)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Breadcrumb
				items={[PERSONAL_CRUMB, { label: <T k="nav.personal.profile">โปรไฟล์</T> }]}
			/>

			<PageHeader
				title={<T k="profile.title">โปรไฟล์ส่วนตัว</T>}
				subtitle={<T k="profile.subtitle">ข้อมูลที่คุณให้ไว้ตอนสมัครสมาชิก</T>}
			/>

			<AvatarCropper
				file={picked}
				busy={uploading}
				onCancel={() => setPicked(null)}
				onConfirm={handleUpload}
			/>

			{profile === undefined && queryView === "loading" && <ProfileSkeleton />}

			{queryView === "failed" && (
				<QueryNotice kind="failed" onRetry={() => query.refetch()} />
			)}

			{profile === null && (
				<div className="card text-center text-sm text-zinc-500 dark:text-zinc-400">
					<T k="profile.missing">คุณยังไม่ได้กรอกข้อมูลบัญชี</T>
				</div>
			)}

			{profile !== undefined && profile !== null && (
				<>
					<div className="card">
						<div className="flex items-center gap-4 pb-2">
							<button
								type="button"
								onClick={() => fileInput.current?.click()}
								disabled={uploading}
								aria-label="Change photo"
								title="Change photo"
								className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-600 text-xl font-semibold text-white disabled:opacity-60"
							>
								<AvatarContent
									key={profile.imageVersion}
									imageVersion={profile.imageVersion}
									initial={profile.nameTh.trim().charAt(0)}
								/>
								<span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
									<Camera className="h-5 w-5" />
								</span>
							</button>
							<input
								ref={fileInput}
								type="file"
								accept={[
									...PRODUCT_IMAGE_EXTENSIONS,
									...PRODUCT_IMAGE_MIME_TYPES,
								].join(",")}
								onChange={handlePick}
								className="sr-only"
							/>
							<div className="min-w-0">
								<p className="flex items-center gap-1.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
									<span className="truncate">{profile.nameTh}</span>
									<VerifiedMark
										verified={profile.status === "verified"}
										official={profile.official}
									/>
								</p>
								<p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
									{profile.nameEn}
								</p>
								<button
									type="button"
									onClick={() => fileInput.current?.click()}
									disabled={uploading}
									className="link text-xs"
								>
									<T k="profile.changePhoto">เปลี่ยนรูปโปรไฟล์</T>
								</button>
							</div>
						</div>
						<dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
							<Row label={<T k="profile.nameTh">ชื่อ (ไทย)</T>}>{profile.nameTh}</Row>
							<Row label={<T k="profile.nameEn">ชื่อ (อังกฤษ)</T>}>
								{profile.nameEn}
							</Row>
						</dl>
					</div>

					<div className="card">
						<div className="flex items-center justify-between gap-3 pb-1">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="profile.bankSection">บัญชีธนาคาร</T>
							</h2>
							{!editingBank && (
								<button
									type="button"
									onClick={() => setEditingBank(true)}
									className="link inline-flex items-center gap-1 text-sm"
								>
									<Pencil className="h-3.5 w-3.5" />
									<T k="profile.editBank">แก้ไข</T>
								</button>
							)}
						</div>
						{editingBank ? (
							<BankEditForm
								initialBank={profile.bank ?? ""}
								onSaved={handleBankSaved}
								onCancel={() => setEditingBank(false)}
							/>
						) : (
							<dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
								<Row label={<T k="profile.bank">ธนาคาร</T>}>
									{profile.bank ? BANK_LABELS[profile.bank] : ""}
								</Row>
								<Row label={<T k="profile.accountName">ชื่อบัญชี</T>}>
									{profile.accountName}
								</Row>
								<Row label={<T k="profile.accountNo">เลขบัญชี</T>}>
									{profile.bankAccountMask}
								</Row>
							</dl>
						)}
					</div>

					<div className="card">
						<div className="flex items-center justify-between gap-3 pb-1">
							<h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								<T k="profile.idSection">การยืนยันตัวตน</T>
							</h2>
							<StatusBadge status={profile.status} />
						</div>
						{profile.status === "rejected" && profile.rejectReason && (
							<p className="alert-error mt-3">{profile.rejectReason}</p>
						)}
						{profile.status !== "none" && (
							<dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
								<Row label={<T k="profile.idNo">เลขบัตรประชาชน</T>}>
									{profile.personalIdMask}
								</Row>
								<Row label={<T k="profile.idExp">วันหมดอายุบัตร</T>}>
									{profile.personalIdExp
										? new Date(profile.personalIdExp).toLocaleDateString()
										: ""}
								</Row>
								<Row label={<T k="profile.address">ที่อยู่</T>}>
									{profile.address ? joinAddress(profile.address) : ""}
								</Row>
							</dl>
						)}
						{profile.status !== "verified" && (
							<Link
								href="/dashboard/verification"
								className="btn-outline mt-3 inline-flex w-auto"
							>
								<IdCard className="h-4 w-4" />
								{profile.status === "none" ? (
									<T k="profile.verify">ยืนยันตัวตน</T>
								) : profile.status === "rejected" ? (
									<T k="profile.verifyRetry">ส่งข้อมูลใหม่</T>
								) : (
									<T k="profile.verifyAgain">ดูหรือส่งข้อมูลใหม่</T>
								)}
							</Link>
						)}
					</div>
				</>
			)}
		</div>
	)
}

export default ProfilePage
