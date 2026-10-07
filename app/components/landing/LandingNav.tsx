import { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";

type TLandingNav = () => ReactNode

const LandingNav: TLandingNav = () => {
	return (
		<header className="absolute inset-x-0 top-5 z-20 px-4">
			<nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-white/15 bg-white/5 py-2 pr-2 pl-5 shadow-[0_0_40px_rgb(45_212_191/0.15)] backdrop-blur-md">
				<Link href="/" aria-label="getZure">
					<Logo className="h-8" />
				</Link>
				<div className="flex items-center gap-1">
					<LanguageToggle />
					<Link
						href="/sign-in"
						className="rounded-full bg-linear-to-r from-teal-500 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgb(45_212_191/0.4)] hover:brightness-110"
					>
						<T k="landing.nav.signIn">เข้าสู่ระบบ</T>
					</Link>
				</div>
			</nav>
		</header>
	)
}

export default LandingNav
