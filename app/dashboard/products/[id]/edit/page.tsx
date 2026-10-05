"use client"

import { useParams, useRouter } from "next/navigation";
import { T } from "@/app/i18n/T";
import { Breadcrumb, PRODUCTS_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { ProductForm } from "@/app/components/ProductForm";
import { showToast } from "@/app/lib/toast";

type TEditProductPage = () => React.ReactNode

const EditProductPage: TEditProductPage = () => {
	const router = useRouter()
	const { id } = useParams<{ id: string }>()

	const handleSaved = () => {
		showToast(<T k="products.edit.done">แก้ไขสินค้าแล้ว</T>)
		router.push("/dashboard/products")
	}

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<Breadcrumb
				items={[
					PRODUCTS_CRUMB,
					{
						label: <T k="products.list.title">คลังสินค้า</T>,
						href: "/dashboard/products",
					},
					{ label: <T k="products.edit.title">แก้ไขสินค้า</T> },
				]}
			/>

			<PageHeader
				title={<T k="products.edit.title">แก้ไขสินค้า</T>}
				subtitle={
					<T k="products.edit.subtitle">แก้ไขรายละเอียด ราคา หรือรูปภาพของสินค้า</T>
				}
			/>

			<div className="card">
				<ProductForm productId={id} onSaved={handleSaved} />
			</div>
		</div>
	)
}

export default EditProductPage
