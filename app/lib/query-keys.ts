type TListParams = { page: number; pageSize: number; categoryId?: number }
type TOrderListParams = { page: number; pageSize: number }

// Keys are nested under products / orders / ... so invalidating the first part reaches all below it.
export const queryKeys = {
	products: {
		all: ["products"] as const,
		list: (params: TListParams) => ["products", "list", params] as const,
		detail: (id: string) => ["products", "detail", id] as const,
		search: (text: string, exclude: string[]) => ["products", "search", text, exclude] as const,
	},
	categories: {
		all: ["categories"] as const,
		detail: (id: string) => ["categories", "detail", id] as const,
	},
	// The category tree has no per-user data, so product changes don't touch it.
	categoryTree: ["category-tree"] as const,
	orders: {
		all: ["orders"] as const,
		list: (params: TOrderListParams) => ["orders", "list", params] as const,
		detail: (id: string) => ["orders", "detail", id] as const,
	},
	guestOrder: (id: string) => ["guest-order", id] as const,
	notifications: ["notifications"] as const,
	profile: ["profile"] as const,
	security: ["security"] as const,
	verification: ["verification"] as const,
	signupInfo: ["signup", "info"] as const,
	twoFactorOptions: ["two-factor", "options"] as const,
}
