"use client"

import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Banknote, Check, Link2, LoaderCircle, Package, Send, Wallet } from "lucide-react";
import { T } from "@/app/i18n/T";

type TStage = 0 | 1 | 2 | 3
type TStep = { icon: ReactNode; label: ReactNode }
type TRevealProps = { show: boolean; children: ReactNode }
type TReveal = (props: TRevealProps) => ReactNode
type TSceneProps = { active: boolean; children: ReactNode }
type TScene = (props: TSceneProps) => ReactNode
type TTickProps = { tick: number }
type TScenePanel = (props: TTickProps) => ReactNode
type TStageOf = (tick: number) => TStage
type TCursorStep = { at: number; target: string }
type TUseTick = () => number
type TOrderDemo = () => ReactNode

const TICK_MS = 600
// The demo plays as a loop of ticks; each scene reads the tick to know what to show.
const LOOP_TICKS = 28
const STAGE_STARTS = [0, 11, 15, 21]
const REDUCED_TICK = 9
// Where the mouse goes (an element with data-cursor) from each tick on; clicks land on CLICK_TICKS.
const CURSOR_PATH: TCursorStep[] = [
	{ at: 0, target: "product" },
	{ at: 3, target: "member" },
	{ at: 8, target: "create" },
	{ at: 12, target: "copy" },
	{ at: 16, target: "pay" },
	{ at: 22, target: "done" },
]
const CLICK_TICKS = [4, 9, 13, 17]

const stageOf: TStageOf = (tick) => {
	return STAGE_STARTS.reduce(
		(stage, start, index) => (tick >= start ? index : stage),
		0,
	) as TStage
}

// Counts the loop; with reduced motion it settles on one finished frame instead.
const useTick: TUseTick = () => {
	const [tick, setTick] = useState(0)

	useEffect(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		const id = setInterval(() => {
			setTick((current) => (reduced ? REDUCED_TICK : (current + 1) % LOOP_TICKS))
		}, TICK_MS)
		return () => clearInterval(id)
	}, [])

	return tick
}

// Wipes its content in from the left, like text being typed.
const Reveal: TReveal = ({ show, children }) => {
	return (
		<span
			className={clsx(
				"inline-block",
				// Only the reveal is animated; a reset to hidden is instant so the loop restarts cleanly.
				show
					? "transition-[clip-path] duration-700 ease-out [clip-path:inset(0_0_0_0)]"
					: "[clip-path:inset(0_100%_0_0)]",
			)}
		>
			{children}
		</span>
	)
}

const Scene: TScene = ({ active, children }) => {
	return (
		<div
			className={clsx(
				"absolute inset-0 flex flex-col justify-center gap-3 transition-all duration-500",
				active
					? "translate-y-0 opacity-100"
					: "pointer-events-none translate-y-3 opacity-0",
			)}
		>
			{children}
		</div>
	)
}

const STEPS: TStep[] = [
	{
		icon: <Package className="h-4 w-4" />,
		label: <T k="landing.demo.step.create">สร้างออเดอร์</T>,
	},
	{ icon: <Send className="h-4 w-4" />, label: <T k="landing.demo.step.share">ส่งลิงก์</T> },
	{
		icon: <Wallet className="h-4 w-4" />,
		label: <T k="landing.demo.step.pay">ผู้ซื้อชำระเงิน</T>,
	},
	{ icon: <Banknote className="h-4 w-4" />, label: <T k="landing.demo.step.receive">รับเงิน</T> },
]

const FormScene: TScenePanel = ({ tick }) => {
	const pressed = tick >= 9
	return (
		<>
			<p className="text-xs text-zinc-400">
				<T k="landing.demo.product">สินค้า</T>
			</p>
			<div
				data-cursor="product"
				className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
			>
				<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-teal-400 to-teal-600">
					<Package className="h-5 w-5" />
				</span>
				<div className="min-w-0 flex-1">
					<Reveal show={tick >= 1}>
						<span className="text-sm font-medium">
							<T k="landing.demo.productName">รองเท้าวิ่ง</T>
						</span>
					</Reveal>
					<p className="text-xs text-zinc-400">
						<Reveal show={tick >= 2}>฿990.00</Reveal>
					</p>
				</div>
				<span className="rounded-md bg-white/10 px-2.5 py-1 text-sm">
					×<Reveal show={tick >= 3}>2</Reveal>
				</span>
			</div>

			<p className="text-xs text-zinc-400">
				<T k="landing.demo.payer">ผู้ชำระเงิน</T>
			</p>
			<div className="flex items-center gap-2">
				<span
					data-cursor="member"
					className={clsx(
						"rounded-lg border px-3 py-1.5 text-sm transition-colors duration-500",
						tick >= 4
							? "border-teal-400 bg-teal-400/15 text-teal-200"
							: "border-white/10",
					)}
				>
					<T k="landing.demo.member">สมาชิก</T>
				</span>
				<span className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-400">
					<T k="landing.demo.guest">ผู้ใช้ทั่วไป</T>
				</span>
				<span className="ml-auto font-mono text-sm text-zinc-300">
					<Reveal show={tick >= 5}>08X-XXX-5678</Reveal>
				</span>
			</div>

			<div
				className={clsx(
					"space-y-1.5 border-t border-white/10 pt-3 text-sm",
					tick >= 6 ? "opacity-100 transition-opacity duration-500" : "opacity-0",
				)}
			>
				<div className="flex justify-between font-medium">
					<T k="landing.demo.total">ยอดชำระสุทธิ</T>
					<span>฿1,980.00</span>
				</div>
				<div className="flex justify-between text-xs text-zinc-400">
					<T k="landing.demo.fee">ค่าธรรมเนียม</T>
					<span>−฿79.20</span>
				</div>
				<div className="flex justify-between text-sky-200">
					<T k="landing.demo.receive">ยอดที่คุณจะได้รับสุทธิ</T>
					<span className="font-bold">฿1,900.80</span>
				</div>
			</div>

			<span
				data-cursor="create"
				className={clsx(
					"mt-1 flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-teal-500 to-teal-600 py-2.5 text-sm font-medium transition-transform duration-300",
					pressed && "scale-95",
				)}
			>
				{tick >= 10 && <Check className="h-4 w-4" />}
				<T k="landing.demo.createButton">สร้างออเดอร์</T>
			</span>
		</>
	)
}

const LinkScene: TScenePanel = ({ tick }) => {
	const copied = tick >= 13
	return (
		<>
			<span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-400/15 text-teal-300">
				<Link2 className="h-7 w-7" />
			</span>
			<p className="text-center font-medium">
				<T k="landing.demo.linkReady">ลิงก์ชำระเงินพร้อมแล้ว</T>
			</p>
			<div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pl-4">
				<span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300">
					<Reveal show={tick >= 12}>getzure/order/7Kq2xP</Reveal>
				</span>
				<span
					data-cursor="copy"
					className={clsx(
						"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-300",
						copied ? "bg-teal-400/20 text-teal-200" : "bg-white/10",
					)}
				>
					{copied && <Check className="h-4 w-4" />}
					{copied ? (
						<T k="landing.demo.copied">คัดลอกแล้ว</T>
					) : (
						<T k="landing.demo.copy">คัดลอก</T>
					)}
				</span>
			</div>
		</>
	)
}

const PayScene: TScenePanel = ({ tick }) => {
	const paying = tick >= 18
	const paid = tick >= 19
	return (
		<>
			<p className="text-center text-sm text-zinc-400">
				<T k="landing.demo.payTitle">ชำระเงินสำหรับออเดอร์</T>
			</p>
			<p className="text-center text-4xl font-bold">฿1,980.00</p>
			<span
				data-cursor="pay"
				className={clsx(
					"mt-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all duration-300",
					paid ? "bg-teal-500/90" : "bg-linear-to-r from-teal-500 to-teal-600",
					tick >= 17 && !paid && "scale-95",
				)}
			>
				{paid ? (
					<Check className="h-4 w-4" />
				) : (
					paying && <LoaderCircle className="h-4 w-4 animate-spin" />
				)}
				{paid ? (
					<T k="landing.demo.paySuccess">ชำระเงินสำเร็จ</T>
				) : (
					<T k="landing.demo.payButton">ชำระเงิน</T>
				)}
			</span>
		</>
	)
}

const ReceiveScene: TScenePanel = ({ tick }) => {
	return (
		<>
			<span
				data-cursor="done"
				className={clsx(
					"mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-400/20 text-teal-300 shadow-[0_0_40px_rgb(45_212_191/0.5)] transition-transform duration-500",
					tick >= 22 ? "scale-100" : "scale-50",
				)}
			>
				<Check className="h-8 w-8" />
			</span>
			<p className="text-center text-sm text-zinc-400">
				<T k="landing.demo.received">ได้รับเงินแล้ว</T>
			</p>
			<p
				className={clsx(
					"text-center text-4xl font-bold text-sky-200 transition-all duration-700",
					tick >= 23 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
				)}
			>
				฿1,900.80
			</p>
		</>
	)
}

// An animated walk through creating an order and getting paid; decoration only.
const OrderDemo: TOrderDemo = () => {
	const tick = useTick()
	const stage = stageOf(tick)
	const cardRef = useRef<HTMLDivElement>(null)
	const cursorRef = useRef<HTMLSpanElement>(null)

	// Moves the mouse onto its target for this tick and clicks on the click ticks.
	useEffect(() => {
		const card = cardRef.current
		const cursor = cursorRef.current
		const step = CURSOR_PATH.filter((item) => item.at <= tick).at(-1)
		const target = step && card?.querySelector(`[data-cursor="${step.target}"]`)
		if (!card || !cursor || !target) return

		const box = target.getBoundingClientRect()
		const origin = card.getBoundingClientRect()
		cursor.style.opacity = "1"
		cursor.style.transform = `translate(${box.left - origin.left + box.width * 0.6}px, ${box.top - origin.top + box.height * 0.6}px)`
		if (CLICK_TICKS.includes(tick)) {
			cursor.classList.remove("demo-click")
			void cursor.offsetWidth
			cursor.classList.add("demo-click")
		}
	}, [tick])

	return (
		<div className="demo-float mx-auto w-full max-w-md" aria-hidden="true">
			<div
				ref={cardRef}
				className="relative rounded-3xl border border-sky-200/30 bg-[#06222a]/70 p-5 shadow-[0_0_80px_rgb(45_212_191/0.2),0_30px_100px_rgb(125_211_252/0.3)] backdrop-blur-xl"
			>
				<div className="mb-5 flex items-center justify-between">
					{STEPS.map((step, index) => (
						<div key={index} className="flex flex-1 items-center last:flex-none">
							<div className="flex flex-col items-center gap-1.5">
								<span
									className={clsx(
										"grid h-9 w-9 place-items-center rounded-full border transition-all duration-500",
										index < stage &&
											"border-teal-400 bg-teal-400 text-slate-900",
										index === stage &&
											"border-teal-300 bg-teal-400/20 text-teal-200 shadow-[0_0_24px_rgb(45_212_191/0.6)]",
										index > stage && "border-white/20 text-zinc-400",
									)}
								>
									{index < stage ? <Check className="h-4 w-4" /> : step.icon}
								</span>
								<span
									className={clsx(
										"text-[0.65rem] whitespace-nowrap",
										index <= stage ? "text-zinc-100" : "text-zinc-400",
									)}
								>
									{step.label}
								</span>
							</div>
							{index < STEPS.length - 1 && (
								<span className="mx-2 mb-5 h-px flex-1 bg-white/15">
									<span
										className={clsx(
											"block h-full origin-left bg-teal-400 transition-transform duration-700",
											index < stage ? "scale-x-100" : "scale-x-0",
										)}
									/>
								</span>
							)}
						</div>
					))}
				</div>

				<div className="relative h-[22rem]">
					<Scene active={stage === 0}>
						<FormScene tick={tick} />
					</Scene>
					<Scene active={stage === 1}>
						<LinkScene tick={tick} />
					</Scene>
					<Scene active={stage === 2}>
						<PayScene tick={tick} />
					</Scene>
					<Scene active={stage === 3}>
						<ReceiveScene tick={tick} />
					</Scene>
				</div>

				<span
					ref={cursorRef}
					className="demo-cursor pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-transform duration-[600ms] ease-in-out motion-reduce:hidden"
				>
					<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
						<path
							d="M2 2v15l4.2-3.8L9 19.5l2.5-1.1-2.7-6.1H14.5L2 2Z"
							fill="white"
							stroke="#0f172a"
							strokeWidth="1.2"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			</div>
		</div>
	)
}

export default OrderDemo
