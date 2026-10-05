import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { T } from "@/app/i18n/T";

export type TCrumb = { label: ReactNode; href?: string }

type TBreadcrumbProps = { items: TCrumb[] }
type TBreadcrumb = (props: TBreadcrumbProps) => ReactNode

// The heading of the menu group a page lives under; it leads the trail and is not a link.
export const PERSONAL_CRUMB: TCrumb = { label: <T k="nav.group.personal">ส่วนตัว</T> }
export const PRODUCTS_CRUMB: TCrumb = { label: <T k="nav.group.products">สินค้า</T> }
export const PAYMENT_CRUMB: TCrumb = { label: <T k="nav.group.payment">การชำระเงิน</T> }

// The trail above a page title; the last item is the current page and is not a link.
export const Breadcrumb: TBreadcrumb = ({ items }) => {
	return (
		<nav
			aria-label="Breadcrumb"
			className="flex flex-wrap items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400"
		>
			{items.map((item, index) => (
				<Fragment key={index}>
					{index > 0 && <ChevronRight className="h-4 w-4 shrink-0" />}
					{index === items.length - 1 ? (
						<span aria-current="page" className="text-zinc-900 dark:text-zinc-50">
							{item.label}
						</span>
					) : item.href ? (
						<Link href={item.href} className="hover:text-teal-600">
							{item.label}
						</Link>
					) : (
						<span>{item.label}</span>
					)}
				</Fragment>
			))}
		</nav>
	)
}
