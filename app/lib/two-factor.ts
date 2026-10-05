import { pool } from "@/app/lib/db";
import { TTwoFactorFactor } from "@/app/lib/validation";

type TSetTwoFactorFactor = (
	userId: string,
	factor: TTwoFactorFactor,
	enabled: boolean,
) => Promise<void>
type TSyncTwoFactorFlag = (userId: string) => Promise<void>

// Better-auth keeps one on/off flag (user.twoFactorEnabled) for all of 2FA. It is derived here:
// on while at least one factor is on (email code, SMS code, a verified authenticator app, or a
// passkey). Changing a factor and recomputing the flag happen in one locked transaction, so two
// requests at the same time can't leave the flag out of step with the factors.
const RECOMPUTE_FLAG_SQL = `
	update "user"
	set "twoFactorEnabled" = (
	  "emailOtpEnabled" or "phoneOtpEnabled"
	  or exists (select 1 from "twoFactor" t where t."userId" = "user".id and t.verified is not false)
	  or exists (select 1 from passkey p where p."userId" = "user".id)
	)
	where id = $1`

export const setTwoFactorFactor: TSetTwoFactorFactor = async (userId, factor, enabled) => {
	const client = await pool.connect()

	try {
		await client.query("BEGIN")
		await client.query(`select 1 from "user" where id = $1 for update`, [userId])

		if (factor === "email") {
			await client.query(`update "user" set "emailOtpEnabled" = $2 where id = $1`, [
				userId,
				enabled,
			])
		} else if (factor === "phone") {
			await client.query(`update "user" set "phoneOtpEnabled" = $2 where id = $1`, [
				userId,
				enabled,
			])
		} else {
			// Removes the secret and the backup codes, which live in the same row.
			await client.query(`delete from "twoFactor" where "userId" = $1`, [userId])
		}

		await client.query(RECOMPUTE_FLAG_SQL, [userId])
		await client.query("COMMIT")
	} catch (err) {
		await client.query("ROLLBACK")
		throw err
	} finally {
		client.release()
	}
}

// For changes better-auth makes itself (a passkey added or removed), so the flag follows.
export const syncTwoFactorFlag: TSyncTwoFactorFlag = async (userId) => {
	await pool.query(RECOMPUTE_FLAG_SQL, [userId])
}
