import { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/app/i18n/T";
import OrderDemo from "./OrderDemo";
import { ParallaxLayer, ParallaxScene } from "./Parallax";
import LandingNav from "./LandingNav";

type THero = () => ReactNode

// The light beam and the grid floor echo the doorway scene; they are decoration behind the content.
const Hero: THero = () => {
	return (
		<ParallaxScene className="landing-bg min-h-screen">
			<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
				<ParallaxLayer
					speed={0.6}
					className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"
				/>
				<ParallaxLayer
					speed={0.2}
					className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
				/>
				<ParallaxLayer
					speed={0.45}
					className="absolute -top-10 right-[12%] h-[70%] w-[16%]"
				>
					<div className="landing-beam h-full w-full" />
				</ParallaxLayer>
				<ParallaxLayer speed={0.15} className="absolute inset-x-0 bottom-0 h-[45%]">
					<div className="landing-floor h-full w-full" />
				</ParallaxLayer>
			</div>

			<LandingNav />

			<main className="relative mx-auto grid max-w-7xl items-center gap-4 px-6 pt-32 pb-16 lg:grid-cols-2 lg:pt-36">
				<ParallaxLayer speed={0.12} className="space-y-6">
					<h1 className="text-4xl leading-[1.3] font-bold sm:text-6xl lg:text-7xl">
						<span className="block">
							<T k="landing.title.1">ให้เรื่องชำระเงิน</T>
						</span>
						<span className="block bg-linear-to-r from-teal-300 via-teal-200 to-sky-200 bg-clip-text text-transparent">
							<T k="landing.title.2">ง่ายขึ้นกว่าเดิม</T>
						</span>
					</h1>
					<p className="max-w-lg text-base leading-7 text-zinc-300">
						<T k="landing.subtitle">
							getZure ตัวกลางระบบชำระเงิน ที่จะทำให้การค้าขายของคุณง่ายขึ้นกว่าเดิม
							ผู้ซื้อไม่ต้องกลัวถูกโกง ผู้ขายได้รับเงินไว ระบบชำระเงินที่ปลอดภัย 100%
						</T>
					</p>
					<Link
						href="/sign-up"
						className="inline-block rounded-full bg-linear-to-r from-teal-500 to-teal-400 px-8 py-3 font-medium text-white shadow-[0_0_36px_rgb(45_212_191/0.35),0_10px_44px_rgb(125_211_252/0.6)] hover:brightness-110"
					>
						<T k="landing.cta">เริ่มต้นใช้งาน</T>
					</Link>
				</ParallaxLayer>

				<ParallaxLayer speed={-0.08}>
					<OrderDemo />
				</ParallaxLayer>
			</main>
		</ParallaxScene>
	)
}

export default Hero
