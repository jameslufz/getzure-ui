import { ReactNode } from "react";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";

type TAuthShellProps = {
	title: ReactNode
	subtitle: ReactNode
	footer?: ReactNode
	children: ReactNode
}
type TAuthShell = (props: TAuthShellProps) => ReactNode

// Centered page used by sign-in, sign-up and the sign-in 2FA step: logo, heading, card, footer.
export const AuthShell: TAuthShell = ({ title, subtitle, footer, children }) => {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
			<div className="absolute top-4 right-4 flex items-center gap-2">
				<LanguageToggle />
				<ThemeToggle />
			</div>

			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3 text-center">
					<div className="logo-mark h-10 w-10 text-sm">G</div>
					<div>
						<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
							{title}
						</h1>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
					</div>
				</div>

				{children}

				{footer && (
					<p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
						{footer}
					</p>
				)}
			</div>
		</div>
	)
}
