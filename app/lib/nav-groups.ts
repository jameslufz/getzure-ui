import {
	ShoppingCart,
	LayoutDashboard,
	KeyRound,
	ShieldCheck,
	UserRound,
	Package,
	PackagePlus,
	ReceiptText,
	IdCard,
	Mail,
	Smartphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/app/i18n/translations";

export type NavItem = {
	key: TranslationKey
	th: string
	icon: LucideIcon
	href: string
}

export type NavGroup = {
	topic?: TranslationKey
	topicTh?: string
	items: NavItem[]
}

// Each group is a menu topic; its items render nested beneath the topic's label.
export const navGroups: NavGroup[] = [
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

// Every page the search can open: the menu items plus pages that are only reached from inside one.
export const searchPages: NavItem[] = [
	...navGroups.flatMap((group) => group.items),
	{
		key: "verification.title",
		th: "การยืนยันตัวตน",
		icon: IdCard,
		href: "/dashboard/verification",
	},
	{
		key: "security.addEmail.title",
		th: "เพิ่มอีเมลของคุณ",
		icon: Mail,
		href: "/dashboard/security/add-email",
	},
	{
		key: "security.addPhone.title",
		th: "เพิ่มเบอร์โทรศัพท์ของคุณ",
		icon: Smartphone,
		href: "/dashboard/security/add-phone",
	},
]
