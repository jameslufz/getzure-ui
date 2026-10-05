"use client"

import { ChangeEventHandler, ReactNode, useEffect, useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { T } from "@/app/i18n/T";

export type TExistingImage = { id: string; url: string }

type TImageUploaderProps = {
	files: File[]
	onChange: (files: File[]) => void
	// Images already stored (edit mode). They count toward maxCount and can be removed.
	existing?: TExistingImage[]
	onExistingChange?: (images: TExistingImage[]) => void
	maxCount: number
	maxBytes: number
	// Extensions (".jpg") and MIME types the picker offers and the check accepts.
	extensions: string[]
	mimeTypes: string[]
}
type TImageUploader = (props: TImageUploaderProps) => ReactNode
type TRejection = "tooMany" | "tooLarge" | "type"
type TIsAllowedType = (file: File) => boolean
type THandlePick = ChangeEventHandler<HTMLInputElement>
type THandleRemove = (index: number) => void
type THandleRemoveExisting = (id: string) => void

// Picks several images, shows a thumbnail for each with a remove button, and rejects the ones
// that are too many, too big or the wrong type before anything is uploaded. The server checks
// again by looking at the file's own bytes.
export const ImageUploader: TImageUploader = ({
	files,
	onChange,
	existing = [],
	onExistingChange,
	maxCount,
	maxBytes,
	extensions,
	mimeTypes,
}) => {
	const [rejection, setRejection] = useState<TRejection | null>(null)

	// One preview URL per file, released when the file goes away.
	const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
	useEffect(() => {
		return () => previews.forEach((url) => URL.revokeObjectURL(url))
	}, [previews])

	const total = existing.length + files.length

	const isAllowedType: TIsAllowedType = (file) => {
		const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
		// Some browsers don't know AVIF and send no type, so the extension is what counts then.
		return extensions.includes(extension) && (file.type === "" || mimeTypes.includes(file.type))
	}

	const handlePick: THandlePick = (event) => {
		const picked = Array.from(event.target.files ?? [])
		// Clearing the input lets the same file be picked again after it was removed.
		event.target.value = ""

		const accepted: File[] = []
		let reason: TRejection | null = null

		for (const file of picked) {
			if (!isAllowedType(file)) reason = "type"
			else if (file.size > maxBytes) reason = "tooLarge"
			else if (total + accepted.length >= maxCount) reason = "tooMany"
			else accepted.push(file)
		}

		setRejection(reason)
		if (accepted.length > 0) onChange([...files, ...accepted])
	}

	const handleRemove: THandleRemove = (index) => {
		setRejection(null)
		onChange(files.filter((_, position) => position !== index))
	}

	const handleRemoveExisting: THandleRemoveExisting = (id) => {
		setRejection(null)
		onExistingChange?.(existing.filter((image) => image.id !== id))
	}

	return (
		<div className="space-y-3">
			{total > 0 && (
				<ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
					{existing.map((image) => (
						<li
							key={image.id}
							className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={image.url} alt="" className="h-full w-full object-cover" />
							<button
								type="button"
								onClick={() => handleRemoveExisting(image.id)}
								aria-label="Remove image"
								className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</li>
					))}
					{files.map((file, index) => (
						<li
							key={`${file.name}-${file.size}-${index}`}
							className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={previews[index]}
								alt=""
								className="h-full w-full object-cover"
							/>
							<button
								type="button"
								onClick={() => handleRemove(index)}
								aria-label="Remove image"
								className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="flex items-center gap-3">
				<label
					className={
						total >= maxCount
							? "btn-outline cursor-not-allowed opacity-60"
							: "btn-outline cursor-pointer"
					}
				>
					<ImagePlus className="h-4 w-4" />
					<T k="products.create.pick">เลือกรูปภาพ</T>
					<input
						type="file"
						multiple
						accept={[...extensions, ...mimeTypes].join(",")}
						disabled={total >= maxCount}
						onChange={handlePick}
						className="sr-only"
					/>
				</label>
				<span className="text-sm text-zinc-500 dark:text-zinc-400">
					{total}/{maxCount}
				</span>
			</div>

			{rejection && (
				<p className="field-error">
					{rejection === "tooMany" ? (
						<T k="products.create.error.tooMany">เพิ่มรูปได้สูงสุด 5 รูป</T>
					) : rejection === "tooLarge" ? (
						<T k="products.create.error.tooLarge">รูปแต่ละรูปต้องไม่เกิน 5 MB</T>
					) : (
						<T k="products.create.error.type">
							อนุญาตเฉพาะไฟล์ jpg, jpeg, png, webp และ avif
						</T>
					)}
				</p>
			)}
		</div>
	)
}
