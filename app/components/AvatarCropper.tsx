"use client"

import { KeyboardEvent, PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { T } from "@/app/i18n/T";
import { Modal } from "@/app/components/Modal";

type TAvatarCropperProps = {
	file: File | null
	busy: boolean
	onCancel: () => void
	onConfirm: (cropped: File) => void
}
type TAvatarCropper = (props: TAvatarCropperProps) => ReactNode
type TPoint = { x: number; y: number }
type TDrag = { pointer: TPoint; start: TPoint }
type TClamp = (offset: TPoint, scale: number, size: TPoint) => TPoint
type TPointerHandler = (event: PointerEvent<HTMLDivElement>) => void
type TKeyHandler = (event: KeyboardEvent<HTMLDivElement>) => void
type TMoveTo = (next: TPoint) => void
type TZoomTo = (next: number) => void
type TConfirm = () => Promise<void>
type TCropFile = (image: HTMLImageElement, offset: TPoint, scale: number) => Promise<File | null>

const VIEW = 288
const OUTPUT_MAX = 1024
const MAX_ZOOM = 3
const KEY_STEP = 12

// Keeps the picture covering the whole square, so no empty edge can be saved.
const clamp: TClamp = (offset, scale, size) => ({
	x: Math.min(0, Math.max(VIEW - size.x * scale, offset.x)),
	y: Math.min(0, Math.max(VIEW - size.y * scale, offset.y)),
})

// Draws exactly the square that is visible into a square canvas and returns it as a JPEG file.
const cropFile: TCropFile = (image, offset, scale) => {
	const sourceSize = VIEW / scale
	const outputSize = Math.min(OUTPUT_MAX, Math.round(sourceSize))
	const canvas = document.createElement("canvas")
	canvas.width = outputSize
	canvas.height = outputSize
	canvas
		.getContext("2d")
		?.drawImage(
			image,
			-offset.x / scale,
			-offset.y / scale,
			sourceSize,
			sourceSize,
			0,
			0,
			outputSize,
			outputSize,
		)

	return new Promise((resolve) => {
		canvas.toBlob(
			(blob) =>
				resolve(blob ? new File([blob], "profile.jpg", { type: "image/jpeg" }) : null),
			"image/jpeg",
			0.92,
		)
	})
}

// Shows a picked picture inside a fixed square: drag it (or use the arrow keys) and zoom to choose what is kept.
export const AvatarCropper: TAvatarCropper = ({ file, busy, onCancel, onConfirm }) => {
	const [image, setImage] = useState<HTMLImageElement | null>(null)
	const [failed, setFailed] = useState(false)
	const [zoom, setZoom] = useState(1)
	const [offset, setOffset] = useState<TPoint>({ x: 0, y: 0 })
	const drag = useRef<TDrag | null>(null)

	useEffect(() => {
		if (!file) return

		const url = URL.createObjectURL(file)
		const loaded = new Image()
		loaded.onload = () => {
			const base = Math.max(VIEW / loaded.naturalWidth, VIEW / loaded.naturalHeight)
			setImage(loaded)
			setFailed(false)
			setZoom(1)
			setOffset(
				clamp(
					{
						x: (VIEW - loaded.naturalWidth * base) / 2,
						y: (VIEW - loaded.naturalHeight * base) / 2,
					},
					base,
					{ x: loaded.naturalWidth, y: loaded.naturalHeight },
				),
			)
		}
		loaded.onerror = () => setFailed(true)
		loaded.src = url

		return () => {
			URL.revokeObjectURL(url)
			setImage(null)
		}
	}, [file])

	const size: TPoint = image
		? { x: image.naturalWidth, y: image.naturalHeight }
		: { x: VIEW, y: VIEW }
	const scale = image ? Math.max(VIEW / size.x, VIEW / size.y) * zoom : 1

	const moveTo: TMoveTo = (next) => setOffset(clamp(next, scale, size))

	const handlePointerDown: TPointerHandler = (event) => {
		event.currentTarget.setPointerCapture(event.pointerId)
		drag.current = { pointer: { x: event.clientX, y: event.clientY }, start: offset }
	}

	const handlePointerMove: TPointerHandler = (event) => {
		if (!drag.current) return
		moveTo({
			x: drag.current.start.x + event.clientX - drag.current.pointer.x,
			y: drag.current.start.y + event.clientY - drag.current.pointer.y,
		})
	}

	const handleKeyDown: TKeyHandler = (event) => {
		const moves: Record<string, TPoint> = {
			ArrowLeft: { x: KEY_STEP, y: 0 },
			ArrowRight: { x: -KEY_STEP, y: 0 },
			ArrowUp: { x: 0, y: KEY_STEP },
			ArrowDown: { x: 0, y: -KEY_STEP },
		}
		const move = moves[event.key]
		if (!move) return

		event.preventDefault()
		moveTo({ x: offset.x + move.x, y: offset.y + move.y })
	}

	// Zooms around the centre of the square, so the middle of what is shown stays put.
	const handleZoom: TZoomTo = (next) => {
		if (!image) return

		const base = Math.max(VIEW / size.x, VIEW / size.y)
		const centre = { x: (VIEW / 2 - offset.x) / scale, y: (VIEW / 2 - offset.y) / scale }
		setZoom(next)
		setOffset(
			clamp(
				{ x: VIEW / 2 - centre.x * base * next, y: VIEW / 2 - centre.y * base * next },
				base * next,
				size,
			),
		)
	}

	const handleConfirm: TConfirm = async () => {
		if (!image) return

		const cropped = await cropFile(image, offset, scale)
		if (cropped) onConfirm(cropped)
	}

	return (
		<Modal
			open={file !== null}
			onClose={() => !busy && onCancel()}
			title={<T k="profile.crop.title">ปรับรูปโปรไฟล์</T>}
		>
			<div className="space-y-4">
				{failed ? (
					<p className="alert-error">
						<T k="profile.crop.failed">เปิดรูปนี้ไม่ได้ กรุณาเลือกรูปอื่น</T>
					</p>
				) : (
					<>
						<div
							tabIndex={0}
							role="application"
							aria-label="Move the picture inside the square"
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={() => (drag.current = null)}
							onPointerCancel={() => (drag.current = null)}
							onKeyDown={handleKeyDown}
							style={{ width: VIEW, height: VIEW, touchAction: "none" }}
							className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-md bg-zinc-200 select-none active:cursor-grabbing dark:bg-zinc-800"
						>
							{image && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={image.src}
									alt=""
									draggable={false}
									style={{
										width: size.x * scale,
										height: size.y * scale,
										transform: `translate(${offset.x}px, ${offset.y}px)`,
									}}
									className="pointer-events-none absolute top-0 left-0 max-w-none"
								/>
							)}
							<span className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
						</div>

						<label className="mx-auto flex max-w-xs items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="profile.crop.zoom">ซูม</T>
							<input
								type="range"
								min={1}
								max={MAX_ZOOM}
								step={0.01}
								value={zoom}
								onChange={(event) => handleZoom(Number(event.target.value))}
								className="w-full accent-teal-600"
							/>
						</label>
						<p className="text-center text-xs text-zinc-400">
							<T k="profile.crop.hint">
								ลากรูปเพื่อเลื่อนตำแหน่ง รูปจะถูกครอบเป็นสี่เหลี่ยมจัตุรัส
							</T>
						</p>
					</>
				)}

				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={busy}
						className="btn-outline"
					>
						<T k="profile.cancel">ยกเลิก</T>
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={busy || !image || failed}
						className="btn-primary"
					>
						<T k="profile.crop.save">บันทึกรูป</T>
					</button>
				</div>
			</div>
		</Modal>
	)
}
