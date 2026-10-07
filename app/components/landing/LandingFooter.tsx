import { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";

type TLandingFooter = () => ReactNode

const LandingFooter: TLandingFooter = () => {
	return (
		<footer className="relative border-t border-white/10 bg-[#020a0d]">
			<div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr]">
				<div className="space-y-4">
					<Link href="/" aria-label="getZure" className="inline-block">
						<Logo className="h-10" />
					</Link>
					<p className="max-w-sm text-sm leading-6 text-zinc-400">
						<T k="landing.footer.tagline">
							ตัวกลางระบบชำระเงิน ที่ทำให้การค้าขายง่ายขึ้นกว่าเดิม
						</T>
					</p>
				</div>

				<nav className="flex flex-col gap-3 text-sm">
					<Link href="/sign-in" className="text-zinc-300 hover:text-teal-300">
						<T k="landing.nav.signIn">เข้าสู่ระบบ</T>
					</Link>
					<Link href="/sign-up" className="text-zinc-300 hover:text-teal-300">
						<T k="landing.footer.signUp">สมัครใช้งาน</T>
					</Link>
				</nav>
			</div>

			<div className="border-t border-white/10">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 text-xs text-zinc-500">
					<p>
						© getZure. <T k="landing.footer.rights">สงวนลิขสิทธิ์</T>
					</p>
					<LanguageToggle />
				</div>
			</div>
		</footer>
	)
}

export default LandingFooter
