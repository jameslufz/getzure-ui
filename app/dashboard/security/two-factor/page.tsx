"use client"

import { useSyncExternalStore } from "react";
import { T } from "@/app/i18n/T";
import { PageHeader } from "@/app/components/PageHeader";
import { AuthenticatorCard } from "@/app/components/pages/security/AuthenticatorCard";
import { EmailTwoFactorCard } from "@/app/components/pages/security/EmailTwoFactorCard";
import { PasskeyCard } from "@/app/components/pages/security/PasskeyCard";
import { PasswordGate } from "@/app/components/pages/security/PasswordGate";
import { PhoneTwoFactorCard } from "@/app/components/pages/security/PhoneTwoFactorCard";
import { PrimaryMethodCard } from "@/app/components/pages/security/PrimaryMethodCard";
import { SecurityLevelCard } from "@/app/components/pages/security/SecurityLevelCard";
import { UnlockBar } from "@/app/components/pages/security/UnlockBar";
import { useSecurityStatus } from "@/app/hooks/useSecurityStatus";
import { getReauth, getServerReauth, subscribeReauth } from "@/app/lib/reauth";

type TTwoFactorPage = () => React.ReactNode

const TwoFactorPage: TTwoFactorPage = () => {
	const { status, refresh } = useSecurityStatus()
	const reauth = useSyncExternalStore(subscribeReauth, getReauth, getServerReauth)

	// Accounts with no password can't be asked for one; their cards say to set one first.
	const needsPassword = !!status?.hasPassword && !reauth
	const password = reauth?.password ?? ""

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<PageHeader
				title={<T k="security.twoFactor.title">ความปลอดภัยสองชั้น</T>}
				subtitle={
					<T k="security.twoFactor.subtitle">
						เพิ่มชั้นการป้องกันให้บัญชีของคุณ เปิดใช้งานได้หลายแบบพร้อมกัน
					</T>
				}
			/>

			{!status ? (
				<div className="card h-32 animate-pulse" />
			) : needsPassword ? (
				<PasswordGate />
			) : (
				<>
					{reauth && <UnlockBar reauth={reauth} />}
					<SecurityLevelCard level={status.level} />
					<PrimaryMethodCard status={status} onChanged={refresh} />
					<PasskeyCard onChanged={refresh} />
					<AuthenticatorCard status={status} password={password} onChanged={refresh} />
					<EmailTwoFactorCard status={status} password={password} onChanged={refresh} />
					<PhoneTwoFactorCard status={status} password={password} onChanged={refresh} />
				</>
			)}
		</div>
	)
}

export default TwoFactorPage
