import { FEE_MINIMUM_SATANG, FEE_TIERS } from "@/app/lib/validation";

export type TFeeBreakdown = { price: number; fee: number; net: number }

type TToSatang = (value: string) => number | null
type TCalculateFee = (priceSatang: number) => number
type TBreakDownSatang = (priceSatang: number) => TFeeBreakdown
type TBreakDown = (value: string) => TFeeBreakdown | null

// "1,234.5" -> 123450. Whole satang only, so the sums stay exact (no floating-point money).
export const toSatang: TToSatang = (value) => {
	const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.replace(/,/g, ""))
	if (!match) return null

	return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"))
}

// Mirrors pricing.Fee in the Go service, which is what actually stores the fee: the rate of the
// band the whole price falls in (not progressive), half-up to the satang, at least the minimum
// fee, and never more than the price. This one only previews it.
export const calculateFee: TCalculateFee = (priceSatang) => {
	const tier = FEE_TIERS.find((item) => priceSatang >= item.fromSatang)
	const rateBps = tier ? tier.rateBps : 0
	const fee = Math.floor((priceSatang * rateBps + 5000) / 10000)

	return Math.min(Math.max(fee, FEE_MINIMUM_SATANG), priceSatang)
}

export const breakDownSatang: TBreakDownSatang = (priceSatang) => {
	const fee = calculateFee(priceSatang)
	return { price: priceSatang / 100, fee: fee / 100, net: (priceSatang - fee) / 100 }
}

export const breakDown: TBreakDown = (value) => {
	const price = toSatang(value)
	return price === null || price <= 0 ? null : breakDownSatang(price)
}
