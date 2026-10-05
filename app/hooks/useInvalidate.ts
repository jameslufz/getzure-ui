"use client"

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/query-keys";

type TInvalidate = () => Promise<void>
type TInvalidations = {
	afterProductChange: TInvalidate
	afterOrderCreated: TInvalidate
	afterProfileChange: TInvalidate
	afterVerificationSubmit: TInvalidate
	afterSecurityChange: TInvalidate
}
type TUseInvalidate = () => TInvalidations

// What each kind of write makes out of date, so lists stay right inside the 5-minute cache.
export const useInvalidate: TUseInvalidate = () => {
	const client = useQueryClient()

	return {
		afterProductChange: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.products.all }),
				client.invalidateQueries({ queryKey: queryKeys.categories.all }),
			])
		},
		// An order takes stock off its products, so the product lists change too.
		afterOrderCreated: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.orders.all }),
				client.invalidateQueries({ queryKey: queryKeys.products.all }),
				client.invalidateQueries({ queryKey: queryKeys.categories.all }),
			])
		},
		afterProfileChange: () => client.invalidateQueries({ queryKey: queryKeys.profile }),
		afterVerificationSubmit: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.verification }),
				client.invalidateQueries({ queryKey: queryKeys.profile }),
			])
		},
		afterSecurityChange: () => client.invalidateQueries({ queryKey: queryKeys.security }),
	}
}
