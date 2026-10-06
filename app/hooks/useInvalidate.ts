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
	afterNotificationRead: TInvalidate
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
		// Profile, identity and security changes can start or end a reminder, so it is asked again.
		afterProfileChange: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.profile }),
				client.invalidateQueries({ queryKey: queryKeys.notifications }),
			])
		},
		afterVerificationSubmit: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.verification }),
				client.invalidateQueries({ queryKey: queryKeys.profile }),
				client.invalidateQueries({ queryKey: queryKeys.notifications }),
			])
		},
		afterSecurityChange: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: queryKeys.security }),
				client.invalidateQueries({ queryKey: queryKeys.notifications }),
			])
		},
		afterNotificationRead: () =>
			client.invalidateQueries({ queryKey: queryKeys.notifications }),
	}
}
