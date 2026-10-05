import { ReactNode } from "react";

// A tiny toast store: any code can call showToast, and <Toaster /> (mounted once in the root
// layout) shows it for a few seconds. It lives outside React so event handlers can call it directly.
const TOAST_DURATION_MS = 3500
// Must match the exit animation in globals.css (.toast-wrap), so the toast is removed once it
// has finished sliding out.
const TOAST_EXIT_MS = 350

export type TToast = { id: number; message: ReactNode; leaving: boolean }

type TShowToast = (message: ReactNode) => void
type TSubscribeToasts = (listener: () => void) => () => void
type TGetToasts = () => TToast[]

const NO_TOASTS: TToast[] = []

let toasts: TToast[] = NO_TOASTS
let nextId = 1
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

export const showToast: TShowToast = (message) => {
	const id = nextId++
	toasts = [...toasts, { id, message, leaving: false }]
	notify()

	setTimeout(() => {
		toasts = toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
		notify()

		setTimeout(() => {
			toasts = toasts.filter((toast) => toast.id !== id)
			notify()
		}, TOAST_EXIT_MS)
	}, TOAST_DURATION_MS)
}

export const subscribeToasts: TSubscribeToasts = (listener) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export const getToasts: TGetToasts = () => toasts

// The server render and the first client render both start with no toasts.
export const getServerToasts: TGetToasts = () => NO_TOASTS
