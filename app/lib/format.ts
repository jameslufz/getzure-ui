type TFormatAmount = (amount: number, currency: string) => string

export const formatAmount: TFormatAmount = (amount, currency) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount)
}
