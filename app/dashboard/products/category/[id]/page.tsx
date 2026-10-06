"use client"

import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { T } from "@/app/i18n/T";
import { useLanguage } from "@/app/i18n/useLanguage";
import { Breadcrumb, PRODUCTS_CRUMB, TCrumb } from "@/app/components/Breadcrumb";
import { CategorySkeleton } from "@/app/components/skeletons/PageSkeletons";
import { PageHeader } from "@/app/components/PageHeader";
import { ProductBrowser } from "@/app/components/ProductBrowser";
import { QueryNotice } from "@/app/components/QueryNotice";
import { categoryHref } from "@/app/lib/products";
import { fetchServiceJson, getQueryView } from "@/app/lib/query-fetch";
import { queryKeys } from "@/app/lib/query-keys";

type TCategoryRef = { id: number; nameTh: string; nameEn: string }
type TSubCategory = TCategoryRef & { productCount: number }
type TCategory = TCategoryRef & {
	isGroup: boolean
	parent?: TCategoryRef
	children?: TSubCategory[]
}
type TCategoryPage = () => ReactNode
type TCategoryName = (category: TCategoryRef) => string
type TCategoryViewProps = { category: TCategory }
type TCategoryView = (props: TCategoryViewProps) => ReactNode

const PAGE_SIZE = 25

// A group lists its sub-categories; a sub-category lists the user's products in it, the same way
// the inventory does.
const CategoryView: TCategoryView = ({ category }) => {
	const lang = useLanguage()
	const nameOf: TCategoryName = (item) => (lang === "th" ? item.nameTh : item.nameEn)
	const crumbs: TCrumb[] = [
		PRODUCTS_CRUMB,
		{ label: <T k="products.list.title">คลังสินค้า</T>, href: "/dashboard/products" },
		...(category.parent
			? [{ label: nameOf(category.parent), href: categoryHref(category.parent.id) }]
			: []),
		{ label: nameOf(category) },
	]

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<Breadcrumb items={crumbs} />

			<PageHeader
				title={nameOf(category)}
				subtitle={
					category.isGroup ? (
						<T k="products.category.groupSubtitle">เลือกหมวดหมู่ย่อยเพื่อดูสินค้า</T>
					) : (
						<T k="products.category.subSubtitle">สินค้าของคุณในหมวดหมู่นี้</T>
					)
				}
			/>

			{category.isGroup ? (
				<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{(category.children ?? []).map((child) => (
						<li key={child.id}>
							<Link
								href={categoryHref(child.id)}
								className="card flex items-center gap-3 transition-shadow hover:shadow-md"
							>
								<FolderOpen className="h-5 w-5 shrink-0 text-teal-600" />
								<span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
									{nameOf(child)}
								</span>
								<span className="badge-accent">{child.productCount}</span>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<ProductBrowser categoryId={category.id} pageSize={PAGE_SIZE} />
			)}
		</div>
	)
}

const CategoryPage: TCategoryPage = () => {
	const { id } = useParams<{ id: string }>()
	const query = useQuery({
		queryKey: queryKeys.categories.detail(id),
		queryFn: ({ signal }) => fetchServiceJson<TCategory>(`/product-categories/${id}`, signal),
	})
	const { data: category } = query
	const queryView = getQueryView(query)

	if (queryView === "loading" || category === undefined) return <CategorySkeleton />
	if (category === null || queryView === "failed") {
		return (
			<div className="mx-auto max-w-xl">
				{category === null ? (
					<div className="card text-center text-sm text-zinc-500 dark:text-zinc-400">
						<T k="products.category.missing">ไม่พบหมวดหมู่นี้</T>
					</div>
				) : (
					<QueryNotice kind="failed" onRetry={() => query.refetch()} />
				)}
			</div>
		)
	}

	// key: moving between categories starts the product list again from page 1.
	return <CategoryView key={category.id} category={category} />
}

export default CategoryPage
