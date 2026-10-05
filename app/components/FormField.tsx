import { ReactNode } from "react";

type TFormFieldProps = {
	label: ReactNode
	required?: boolean
	error?: ReactNode
	hint?: ReactNode
	children: ReactNode
}
type TFormField = (props: TFormFieldProps) => ReactNode

// Label, control and the error (or hint) line shared by every form. The error wins over the hint.
export const FormField: TFormField = ({ label, required, error, hint, children }) => {
	return (
		<div>
			<label className="label">
				{label}
				{required && <span className="text-red-500"> *</span>}
			</label>
			{children}
			{error ? (
				<p className="field-error">{error}</p>
			) : (
				hint && <p className="field-hint">{hint}</p>
			)}
		</div>
	)
}
