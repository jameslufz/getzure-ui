"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, LayoutDashboard, KeyRound, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { T } from "@/app/i18n/T";
import type { TranslationKey } from "@/app/i18n/translations";

type NavItem = {
	key: TranslationKey;
	icon: LucideIcon;
	href: string;
};

type NavGroup = {
	topic?: TranslationKey;
	items: NavItem[];
};

// Add a new group here to introduce another menu topic — every item
// listed under it renders nested beneath that topic's label.
const navGroups: NavGroup[] = [
	{
		topic: "nav.group.personal",
		items: [
			{
				key: "nav.personal.dashboard",
				icon: LayoutDashboard,
				href: "/dashboard",
			},
			{
				key: "nav.personal.changePassword",
				icon: KeyRound,
				href: "#",
			},
			{
				key: "nav.personal.verification",
				icon: ShieldCheck,
				href: "#",
			},
		],
	},
	{
		topic: "nav.group.payment",
		items: [
			{
				key: "nav.createPaymentLink",
				icon: Link2,
				href: "/dashboard/payment/create-link",
			},
		],
	},
];

const Navbar = () => {
	const pathname = usePathname();

	return (
		<nav className="flex-1 space-y-6 px-3 py-4">
			{navGroups.map((group, index) => (
				<div key={group.topic ?? index}>
					{group.topic && (
						<p className="px-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
							<T k={group.topic} />
						</p>
					)}
					<div className="mt-2 space-y-1">
						{group.items.map(({ key, icon: Icon, href }) => {
							const active = pathname === href;
							return (
								<Link
									key={key}
									href={href}
									className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
										active
											? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
											: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
									}`}
								>
									<Icon className="h-4.5 w-4.5" />
									<T k={key} />
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
};

export default Navbar;
