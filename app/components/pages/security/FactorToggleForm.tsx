import { ReactNode, useState } from "react";
import Link from "next/link";
import { T } from "@/app/i18n/T";
import { clearReauth } from "@/app/lib/reauth";
import { apiFetch } from "@/app/lib/session";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import { TTwoFactorFactor } from "@/app/lib/validation";

type TFactorToggleFormProps = {
	factor: TTwoFactorFactor
	enabled: boolean
	hasPassword: boolean
	// The password typed once at the top of the page (see PasswordGate).
	password: string
	onChanged: () => void
}
type TFactorToggleForm = (props: TFactorToggleFormProps) => ReactNode

// Turns one factor on or off. The server still checks the password on every change.
export const FactorToggleForm: TFactorToggleForm = ({
	factor,
	enabled,
	hasPassword,
	password,
	onChanged,
}) => {
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)
	const [saving, setSaving] = useState(false)

	const handleToggle = async () => {
		setServerError(null)
		setSaving(true)
		try {
			const res = await apiFetch("/api/security/two-factor", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ factor, enabled: !enabled, password }),
			})
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			onChanged()
		} catch (err) {
			const kind = err instanceof SignupApiError ? err.kind : "generic"
			// The password was changed elsewhere, so what we remember is stale: ask again.
			if (kind === "invalidPassword") clearReauth()
			setServerError(kind)
		} finally {
			setSaving(false)
		}
	}

	if (!hasPassword) {
		return (
			<p className="alert-error">
				<T k="security.twoFactor.needPassword">ต้องตั้งรหัสผ่านก่อนจึงจะเปิดใช้งานได้</T>{" "}
				<Link href="/dashboard/security/change-password" className="link underline">
					<T k="security.twoFactor.setPassword">ตั้งรหัสผ่าน</T>
				</Link>
			</p>
		)
	}

	return (
		<div className="space-y-4">
			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}
			<button
				type="button"
				disabled={saving}
				onClick={handleToggle}
				className={enabled ? "btn-outline" : "btn-primary"}
			>
				{enabled ? (
					<T k="security.twoFactor.disable">ปิดใช้งาน</T>
				) : (
					<T k="security.twoFactor.enable">เปิดใช้งาน</T>
				)}
			</button>
		</div>
	)
}
