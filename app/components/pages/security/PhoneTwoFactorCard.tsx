import { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/app/i18n/T";
import { TSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { FactorCard } from "./FactorCard";
import { FactorToggleForm } from "./FactorToggleForm";

type TPhoneTwoFactorCardProps = { status: TSecurityStatus; password: string; onChanged: () => void }
type TPhoneTwoFactorCard = (props: TPhoneTwoFactorCardProps) => ReactNode

export const PhoneTwoFactorCard: TPhoneTwoFactorCard = ({ status, password, onChanged }) => {
	return (
		<FactorCard
			title={<T k="security.twoFactor.phone.title">รหัส OTP ทาง SMS</T>}
			subtitle={
				<T k="security.twoFactor.phone.subtitle">
					ทุกครั้งที่เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เราจะส่งรหัส OTP
					ไปยังเบอร์โทรศัพท์ของคุณ
				</T>
			}
			enabled={status.phoneOtpEnabled}
		>
			{status.phone ? (
				<>
					<p className="text-sm text-zinc-600 dark:text-zinc-300">{status.phone}</p>
					<FactorToggleForm
						factor="phone"
						enabled={status.phoneOtpEnabled}
						hasPassword={status.hasPassword}
						password={password}
						onChanged={onChanged}
					/>
				</>
			) : (
				<>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						<T k="security.twoFactor.phone.missing">
							คุณยังไม่ได้เพิ่มเบอร์โทรศัพท์ที่ยืนยันแล้ว
						</T>
					</p>
					<Link href="/dashboard/security/add-phone" className="btn-primary inline-block">
						<T k="security.addPhone.button">เพิ่มเบอร์โทรศัพท์</T>
					</Link>
				</>
			)}
		</FactorCard>
	)
}
