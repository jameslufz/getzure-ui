"use client"

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import {
	ShoppingCart,
	LayoutDashboard,
	KeyRound,
	ShieldCheck,
	UserRound,
	Package,
	PackagePlus,
	ReceiptText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react";
import { T } from "@/app/i18n/T";
import { translations, type TranslationKey } from "@/app/i18n/translations";

type NavItem = {
	key: TranslationKey
	th: string
	icon: LucideIcon
	href: string
}

type NavGroup = {
	topic?: TranslationKey
	topicTh?: string
	items: NavItem[]
}

// Add a new group here to introduce another menu topic — every item
// listed under it renders nested beneath that topic's label.
const navGroups: NavGroup[] = [
	{
		topic: "nav.group.personal",
		topicTh: "ส่วนตัว",
		items: [
			{
				key: "nav.personal.dashboard",
				th: "แดชบอร์ด",
				icon: LayoutDashboard,
				href: "/dashboard",
			},
			{
				key: "nav.personal.profile",
				th: "โปรไฟล์",
				icon: UserRound,
				href: "/dashboard/profile",
			},
			{
				key: "nav.security.changePassword",
				th: "เปลี่ยนรหัสผ่าน",
				icon: KeyRound,
				href: "/dashboard/security/change-password",
			},
			{
				key: "nav.security.twoFactor",
				th: "ความปลอดภัยสองชั้น",
				icon: ShieldCheck,
				href: "/dashboard/security/two-factor",
			},
		],
	},
	{
		topic: "nav.group.products",
		topicTh: "สินค้า",
		items: [
			{
				key: "nav.products.list",
				th: "คลังสินค้า",
				icon: Package,
				href: "/dashboard/products",
			},
			{
				key: "nav.products.create",
				th: "เพิ่มสินค้า",
				icon: PackagePlus,
				href: "/dashboard/products/create",
			},
		],
	},
	{
		topic: "nav.group.payment",
		topicTh: "การชำระเงิน",
		items: [
			{
				key: "nav.createOrder",
				th: "สร้างออเดอร์",
				icon: ShoppingCart,
				href: "/dashboard/orders/create",
			},
			{
				key: "nav.orders.list",
				th: "รายการออเดอร์",
				icon: ReceiptText,
				href: "/dashboard/orders",
			},
		],
	},
]

const Navbar = () => {
	const pathname = usePathname()

	return (
		<nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
			{navGroups.map((group, index) => (
				<div key={group.topic ?? index}>
					{group.topic && (
						<p
							data-en={translations[group.topic]}
							data-th={group.topicTh}
							className="px-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase before:content-[attr(data-en)] th:before:content-[attr(data-th)] dark:text-zinc-500"
						/>
					)}
					<div className="mt-2 space-y-1">
						{group.items.map(({ key, th, icon: Icon, href }) => {
							const active = pathname === href
							return (
								<Link
									key={key}
									href={href}
									className={clsx(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
										active
											? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
											: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
									)}
								>
									<Icon className="h-4.5 w-4.5" />
									<T k={key}>{th}</T>
								</Link>
							)
						})}
					</div>
				</div>
			))}
		</nav>
	)
}

export default Navbar
