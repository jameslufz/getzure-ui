import { pool } from "@/app/lib/db";

type THasPassword = (userId: string) => Promise<boolean>

// Phone and Google sign-ups have no credential account until they set a password.
export const hasPassword: THasPassword = async (userId) => {
	const { rowCount } = await pool.query(
		`select 1 from account where "userId" = $1 and "providerId" = 'credential' and password is not null`,
		[userId],
	)
	return rowCount === 1
}
