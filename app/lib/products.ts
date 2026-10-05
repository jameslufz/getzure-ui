import { clientServiceUrl } from "@/app/lib/client-service";

// A product as the pickers see it: just enough to show a row and to link it to an order.
export type TProductSummary = {
	id: string
	name: string
	price: string
	stock: number
	imageId: string | null
}

type TCategoryHref = (categoryId: number) => string
type TProductImageUrl = (productId: string, imageId: string) => string
type TOrderItemImageUrl = (orderId: string, productId: string) => string
type TOrderImageUrl = (orderId: string, imageId: string) => string

export const productImageUrl: TProductImageUrl = (productId, imageId) => {
	return clientServiceUrl(`/products/${productId}/images/${imageId}`)
}

// Customers don't own the product, so an order's item pictures come through the order.
export const orderItemImageUrl: TOrderItemImageUrl = (orderId, productId) => {
	return clientServiceUrl(`/orders/${orderId}/items/${productId}/image`)
}

export const orderImageUrl: TOrderImageUrl = (orderId, imageId) => {
	return clientServiceUrl(`/orders/${orderId}/images/${imageId}`)
}

// The page of a category: for a group it lists the sub-categories, for a sub-category the products.
export const categoryHref: TCategoryHref = (categoryId) =>
	`/dashboard/products/category/${categoryId}`
