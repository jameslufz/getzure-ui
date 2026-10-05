"use client"

import { useRouter } from "next/navigation";
import { T } from "@/app/i18n/T";
import { Breadcrumb, PRODUCTS_CRUMB } from "@/app/components/Breadcrumb";
import { PageHeader } from "@/app/components/PageHeader";
import { ProductForm } from "@/app/components/ProductForm";
import { showToast } from "@/app/lib/toast";

type TCreateProductPage = () => React.ReactNode

const CreateProductPage: TCreateProductPage = () => {
	const router = useRouter()

	const handleCreated = () => {
		showToast(<T k="products.create.done">เพิ่มสินค้าแล้ว</T>)
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
					{ label: <T k="products.create.title">เพิ่มสินค้า</T> },
				]}
			/>

			<PageHeader
				title={<T k="products.create.title">เพิ่มสินค้า</T>}
				subtitle={
					<T k="products.create.subtitle">เพิ่มสินค้าพร้อมราคาและรูปภาพได้สูงสุด 5 รูป</T>
				}
			/>

			<div className="card">
				<ProductForm onSaved={handleCreated} />
			</div>
		</div>
	)
}

export default CreateProductPage
