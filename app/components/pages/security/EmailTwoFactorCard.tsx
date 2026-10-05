import { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/app/i18n/T";
import { TSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { FactorCard } from "./FactorCard";
import { FactorToggleForm } from "./FactorToggleForm";

type TEmailTwoFactorCardProps = { status: TSecurityStatus; password: string; onChanged: () => void }
type TEmailTwoFactorCard = (props: TEmailTwoFactorCardProps) => ReactNode

export const EmailTwoFactorCard: TEmailTwoFactorCard = ({ status, password, onChanged }) => {
	return (
		<FactorCard
			title={<T k="security.twoFactor.email.title">รหัส OTP ทางอีเมล</T>}
			subtitle={
				<T k="security.twoFactor.email.subtitle">
					ทุกครั้งที่เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เราจะส่งรหัส OTP ไปยังอีเมลของคุณ
				</T>
			}
			enabled={status.emailOtpEnabled}
		>
			{status.emailVerified ? (
				<>
					<p className="text-sm text-zinc-600 dark:text-zinc-300">{status.email}</p>
					<FactorToggleForm
						factor="email"
						enabled={status.emailOtpEnabled}
						hasPassword={status.hasPassword}
						password={password}
						onChanged={onChanged}
					/>
				</>
			) : (
				<>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						<T k="security.twoFactor.email.missing">
							คุณยังไม่ได้เพิ่มอีเมลที่ยืนยันแล้ว
						</T>
					</p>
					<Link href="/dashboard/security/add-email" className="btn-primary inline-block">
						<T k="security.addEmail.button">เพิ่มอีเมล</T>
					</Link>
				</>
			)}
		</FactorCard>
	)
}
