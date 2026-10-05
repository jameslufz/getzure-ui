"use client"

import { useEffect, useState } from "react";

export type TLang = "th" | "en"

export const LANG_CHANGE_EVENT = "getzure:langchange"

type THandleLangChange = (e: Event) => void

export const useLanguage = (): TLang => {
	const [lang, setLang] = useState<TLang>("en")

	useEffect(() => {
		const syncFromDocument = () => setLang(document.documentElement.lang === "th" ? "th" : "en")
		const handleLangChange: THandleLangChange = (e) => setLang((e as CustomEvent<TLang>).detail)

		syncFromDocument()
		window.addEventListener(LANG_CHANGE_EVENT, handleLangChange)
		return () => window.removeEventListener(LANG_CHANGE_EVENT, handleLangChange)
	}, [])

	return lang
}
