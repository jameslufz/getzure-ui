"use client"

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type TModalProps = {
	open: boolean
	onClose: () => void
	title: ReactNode
	children: ReactNode
}
type TModal = (props: TModalProps) => ReactNode
type THandleKeyDown = (event: KeyboardEvent) => void

// A dialog over the page: closes on Escape or a click on the backdrop, and the page behind it
// doesn't scroll. It is drawn into <body>, but React still passes events up to the component that
// rendered it, so never render a Modal inside a <form> that has its own submit.
export const Modal: TModal = ({ open, onClose, title, children }) => {
	useEffect(() => {
		if (!open) return

		const handleKeyDown: THandleKeyDown = (event) => {
			if (event.key === "Escape") onClose()
		}
		const previousOverflow = document.body.style.overflow

		document.addEventListener("keydown", handleKeyDown)
		document.body.style.overflow = "hidden"
		return () => {
			document.removeEventListener("keydown", handleKeyDown)
			document.body.style.overflow = previousOverflow
		}
	}, [open, onClose])

	if (!open) return null

	return createPortal(
		<div className="fixed inset-0 z-40 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
			<div
				role="dialog"
				aria-modal="true"
				className="card relative max-h-full w-full max-w-xl overflow-y-auto shadow-xl"
			>
				<div className="mb-4 flex items-start justify-between gap-4">
					<h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				{children}
			</div>
		</div>,
		document.body,
	)
}
