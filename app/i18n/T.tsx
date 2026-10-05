import { ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

type TTranslateProps = { k: TranslationKey; children: string }
type TTranslate = (props: TTranslateProps) => ReactNode

export const T: TTranslate = ({ k, children }) => {
	return (
		<>
			<span className="th:hidden">{translations[k]}</span>
			<span className="hidden th:inline">{children}</span>
		</>
	)
}
