import { translations, type TranslationKey } from "./translations";

export const T = ({ k, children }: { k: TranslationKey; children: string }) => {
	return (
		<>
			<span className="th:hidden">{translations[k]}</span>
			<span className="hidden th:inline">{children}</span>
		</>
	)
}
