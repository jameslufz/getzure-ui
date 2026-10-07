"use client"

import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { T } from "@/app/i18n/T";

type TInstallPrompt = Event & { prompt: () => Promise<void> }
type TIosNavigator = Navigator & { standalone?: boolean }
type TIsIosBrowser = () => boolean
type TNoopSubscribe = () => () => void
type TInstallAppButton = () => ReactNode

const noopSubscribe: TNoopSubscribe = () => () => {}

// iPhone and iPad never fire an install event; there the app is added by hand from the share menu.
const isIosBrowser: TIsIosBrowser = () => {
	const ios =
		/iphone|ipad|ipod/i.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	const installed =
		window.matchMedia("(display-mode: standalone)").matches ||
		(navigator as TIosNavigator).standalone === true
	return ios && !installed
}

// Chrome, Edge and Android get a real install prompt; iOS gets the steps to follow instead.
const InstallAppButton: TInstallAppButton = () => {
	const [prompt, setPrompt] = useState<TInstallPrompt | null>(null)
	const [helpOpen, setHelpOpen] = useState(false)
	const ios = useSyncExternalStore(noopSubscribe, isIosBrowser, () => false)

	useEffect(() => {
		const onPrompt = (event: Event) => {
			event.preventDefault()
			setPrompt(event as TInstallPrompt)
		}
		const onInstalled = () => setPrompt(null)

		window.addEventListener("beforeinstallprompt", onPrompt)
		window.addEventListener("appinstalled", onInstalled)
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt)
			window.removeEventListener("appinstalled", onInstalled)
		}
	}, [])

	if (!prompt && !ios) return null

	const install = async () => {
		if (!prompt) {
			setHelpOpen(true)
			return
		}
		await prompt.prompt()
		setPrompt(null)
	}

	return (
		<>
			<button
				type="button"
				onClick={install}
				className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				<Download className="h-4 w-4" />
				<span className="hidden sm:inline">
					<T k="pwa.install">ติดตั้งแอป</T>
				</span>
			</button>

			<Modal
				open={helpOpen}
				onClose={() => setHelpOpen(false)}
				title={<T k="pwa.ios.title">ติดตั้ง getZure บน iPhone</T>}
			>
				<ol className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
					<li className="flex items-start gap-3">
						<Share className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
						<T k="pwa.ios.step1">แตะปุ่ม “แชร์” ที่แถบเครื่องมือของเบราว์เซอร์</T>
					</li>
					<li className="flex items-start gap-3">
						<SquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
						<T k="pwa.ios.step2">เลื่อนลงแล้วแตะ “เพิ่มไปยังหน้าจอโฮม”</T>
					</li>
					<li className="flex items-start gap-3">
						<Download className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
						<T k="pwa.ios.step3">
							แตะ “เพิ่ม” แล้วไอคอน getZure จะอยู่บนหน้าจอโฮมเหมือนแอป
						</T>
					</li>
				</ol>
				<p className="field-hint mt-4">
					<T k="pwa.ios.note">ถ้าไม่เห็นตัวเลือกนี้ ให้เปิดหน้านี้ด้วย Safari</T>
				</p>
			</Modal>
		</>
	)
}

export default InstallAppButton
