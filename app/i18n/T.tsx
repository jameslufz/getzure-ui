import { translations, type TranslationKey } from "./translations";

export const T = ({ k }: { k: TranslationKey }) => {
	const entry = translations[k]
	return (
		<>
			<span className="th:hidden">{entry.en}</span>
			<span className="hidden th:inline">{entry.th}</span>
		</>
	)
}
