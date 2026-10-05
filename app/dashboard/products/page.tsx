"use client"

import { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { T } from "@/app/i18n/T";
import { Breadcrumb, PRODUCTS_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { ProductBrowser } from "@/app/components/ProductBrowser";

type TProductsPage = () => ReactNode

const PAGE_SIZE = 10

const ProductsPage: TProductsPage = () => {
	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<Breadcrumb
				items={[PRODUCTS_CRUMB, { label: <T k="products.list.title">คลังสินค้า</T> }]}
			/>

			<div className="flex items-start justify-between gap-4">
				<PageHeader
					title={<T k="products.list.title">คลังสินค้า</T>}
					subtitle={<T k="products.list.subtitle">สินค้าทั้งหมดที่คุณสร้างไว้</T>}
				/>
				<Link
					href="/dashboard/products/create"
					className="btn-primary inline-flex shrink-0 items-center gap-1.5"
				>
					<Plus className="h-4 w-4" />
					<T k="products.list.create">เพิ่มสินค้า</T>
				</Link>
			</div>

			<ProductBrowser pageSize={PAGE_SIZE} />
		</div>
	)
}

export default ProductsPage
