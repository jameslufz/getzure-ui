import { ReactNode, useState } from "react";
import { Fingerprint, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { T } from "@/app/i18n/T";
import { TSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { serviceFetch } from "@/app/lib/session";
import { showToast } from "@/app/lib/toast";
import {
	parseApiErrorKind,
	SERVER_ERROR_MESSAGES,
	SignupApiError,
	TServerErrorKind,
} from "@/app/lib/signup-errors"
import {
	getEffectivePrimary,
	getEnabledMethodList,
	TTwoFactorMethod,
} from "@/app/lib/two-factor-primary"
import { FactorCard } from "./FactorCard";

type TPrimaryMethodCardProps = { status: TSecurityStatus; onChanged: () => void }
type TPrimaryMethodCard = (props: TPrimaryMethodCardProps) => ReactNode
type TMethodView = { icon: ReactNode; label: ReactNode }

const METHOD_VIEWS: Record<TTwoFactorMethod, TMethodView> = {
	passkey: {
		icon: <Fingerprint className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.passkey.title">ลายนิ้วมือ / Passkey</T>,
	},
	totp: {
		icon: <ShieldCheck className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.twoFactor.totp.title">แอปยืนยันตัวตน (Google Authenticator)</T>,
	},
	email: {
		icon: <Mail className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.twoFactor.email.title">รหัส OTP ทางอีเมล</T>,
	},
	phone: {
		icon: <Smartphone className="h-5 w-5 text-zinc-400" />,
		label: <T k="security.twoFactor.phone.title">รหัส OTP ทาง SMS</T>,
	},
}

// Which turned-on method the sign-in page offers first. Every enabled method keeps working;
// this only changes the order. Passkey is recommended because there is nothing to type or phish.
export const PrimaryMethodCard: TPrimaryMethodCard = ({ status, onChanged }) => {
	const [saving, setSaving] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)

	const enabled = {
		passkey: status.passkeyCount > 0,
		totp: status.totpEnabled,
		email: status.emailOtpEnabled,
		phone: status.phoneOtpEnabled,
	}
	const methods = getEnabledMethodList(enabled)
	const primary = getEffectivePrimary(enabled, status.twoFactorPrimary)

	if (methods.length === 0) return null

	const handleChoose = async (method: TTwoFactorMethod) => {
		setServerError(null)
		setSaving(true)
		try {
			const res = await serviceFetch("/security/two-factor/primary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ method }),
			})
			if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
			showToast(<T k="security.primary.saved">บันทึกวิธีหลักแล้ว</T>)
			onChanged()
		} catch (err) {
			setServerError(err instanceof SignupApiError ? err.kind : "generic")
		} finally {
			setSaving(false)
		}
	}

	return (
		<FactorCard
			title={<T k="security.primary.title">วิธียืนยันหลักตอนเข้าสู่ระบบ</T>}
			subtitle={
				<T k="security.primary.subtitle">
					วิธีที่จะแสดงเป็นอันดับแรกตอนเข้าสู่ระบบ วิธีอื่นที่เปิดไว้ยังใช้ได้เสมอ
				</T>
			}
		>
			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}
			<div role="radiogroup" className="space-y-2">
				{methods.map((method) => (
					<button
						key={method}
						type="button"
						role="radio"
						aria-checked={primary === method}
						disabled={saving}
						onClick={() => handleChoose(method)}
						className="option"
					>
						{METHOD_VIEWS[method].icon}
						<span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
							<span className="font-medium text-zinc-900 dark:text-zinc-50">
								{METHOD_VIEWS[method].label}
							</span>
							{method === "passkey" && (
								<span className="badge-accent">
									<T k="security.recommended">แนะนำ</T>
								</span>
							)}
						</span>
						{primary === method && (
							<span className="badge-success">
								<T k="security.primary.selected">เลือกแล้ว</T>
							</span>
						)}
					</button>
				))}
			</div>

			{!enabled.passkey && (
				<p className="field-hint">
					<T k="security.primary.suggestPasskey">
						แนะนำให้เพิ่ม Passkey: ไม่ต้องพิมพ์อะไรและถูกหลอกขโมยไม่ได้ เพิ่มได้ด้านล่าง
					</T>
				</p>
			)}
		</FactorCard>
	)
}
