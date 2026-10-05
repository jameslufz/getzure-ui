import { ReactNode } from "react";

type TPageHeaderProps = { title: ReactNode; subtitle: ReactNode }
type TPageHeader = (props: TPageHeaderProps) => ReactNode

export const PageHeader: TPageHeader = ({ title, subtitle }) => {
	return (
		<div>
			<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
			<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
		</div>
	)
}
