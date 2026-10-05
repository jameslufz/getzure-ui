import { ReactNode, useState } from "react";
import { Fingerprint, Trash2 } from "lucide-react";
import { T } from "@/app/i18n/T";
import { authClient } from "@/app/lib/auth-client";
import { FactorCard } from "./FactorCard";
import {
	kindFromAuthClientError,
	SERVER_ERROR_MESSAGES,
	TServerErrorKind,
} from "@/app/lib/signup-errors"

type TPasskeyCardProps = { onChanged: () => void }
type TPasskeyCard = (props: TPasskeyCardProps) => ReactNode

export const PasskeyCard: TPasskeyCard = ({ onChanged }) => {
	const { data: passkeys, refetch } = authClient.useListPasskeys()
	const [name, setName] = useState("")
	const [busy, setBusy] = useState(false)
	const [serverError, setServerError] = useState<TServerErrorKind | null>(null)

	const handleAdd = async () => {
		setServerError(null)
		setBusy(true)
		const { error } = await authClient.passkey.addPasskey({ name: name.trim() || undefined })
		setBusy(false)
		if (error) return setServerError(kindFromAuthClientError(error))
		setName("")
		refetch()
		onChanged()
	}

	const handleDelete = async (id: string) => {
		setServerError(null)
		setBusy(true)
		const { error } = await authClient.passkey.deletePasskey({ id })
		setBusy(false)
		if (error) return setServerError(kindFromAuthClientError(error))
		refetch()
		onChanged()
	}

	return (
		<FactorCard
			title={<T k="security.passkey.title">ลายนิ้วมือ / Passkey</T>}
			subtitle={
				<T k="security.passkey.subtitle">
					ยืนยันตัวตนด้วยลายนิ้วมือ ใบหน้า หรือ PIN ของอุปกรณ์ โดยไม่ต้องพิมพ์รหัส
				</T>
			}
			enabled={!!passkeys && passkeys.length > 0}
		>
			{serverError && (
				<p className="alert-error">
					<T k={SERVER_ERROR_MESSAGES[serverError].key}>
						{SERVER_ERROR_MESSAGES[serverError].th}
					</T>
				</p>
			)}

			{passkeys && passkeys.length > 0 && (
				<ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
					{passkeys.map((passkey) => (
						<li
							key={passkey.id}
							className="flex items-center justify-between gap-3 px-3 py-2"
						>
							<div className="flex min-w-0 items-center gap-2">
								<Fingerprint className="h-4 w-4 shrink-0 text-zinc-400" />
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
										{passkey.name || "Passkey"}
									</p>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">
										{new Date(passkey.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<button
								type="button"
								disabled={busy}
								onClick={() => handleDelete(passkey.id)}
								aria-label="Delete passkey"
								className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-zinc-800"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="flex flex-col gap-2 sm:flex-row">
				<input
					type="text"
					maxLength={50}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="ชื่ออุปกรณ์ของคุณ เช่น MacBook, iPhone"
					className="input"
				/>
				<button
					type="button"
					disabled={busy}
					onClick={handleAdd}
					className="btn-primary whitespace-nowrap"
				>
					<T k="security.passkey.add">เพิ่ม Passkey</T>
				</button>
			</div>
		</FactorCard>
	)
}
