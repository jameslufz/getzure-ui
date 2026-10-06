"use client"

import { ReactNode } from "react";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { NumericFormat } from "react-number-format";

type TQuantityInputProps = {
	value: string
	onChange: (value: string) => void
	min: number
	max: number
	invalid?: boolean
	thousandSeparator?: boolean
	placeholder?: string
	onBlur?: () => void
	label: string
}
type TQuantityInput = (props: TQuantityInputProps) => ReactNode
type TStepTo = (step: number) => void

const STEP_BUTTON = "btn-outline w-10 shrink-0 px-0"

// A whole-number box with - and + buttons beside it, for people who would rather not type.
export const QuantityInput: TQuantityInput = ({
	value,
	onChange,
	min,
	max,
	invalid,
	thousandSeparator,
	placeholder,
	onBlur,
	label,
}) => {
	const current = Number(value) || 0

	// Steps from what is typed and stays inside min and max.
	const stepTo: TStepTo = (step) => onChange(String(Math.min(max, Math.max(min, current + step))))

	return (
		<div className="flex items-stretch gap-1.5">
			<button
				type="button"
				aria-label={`${label} -`}
				disabled={current <= min}
				onClick={() => stepTo(-1)}
				className={STEP_BUTTON}
			>
				<Minus className="h-4 w-4" />
			</button>
			<NumericFormat
				thousandSeparator={thousandSeparator ? "," : undefined}
				decimalScale={0}
				allowNegative={false}
				inputMode="numeric"
				placeholder={placeholder}
				value={value}
				onValueChange={(values) => onChange(values.value)}
				onBlur={onBlur}
				aria-label={label}
				aria-invalid={invalid}
				className={clsx("input min-w-0 flex-1 text-center")}
			/>
			<button
				type="button"
				aria-label={`${label} +`}
				disabled={current >= max}
				onClick={() => stepTo(1)}
				className={STEP_BUTTON}
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	)
}
