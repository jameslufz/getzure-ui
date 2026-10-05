import { pool } from "@/app/lib/db";
import { isPlaceholderEmail } from "@/app/lib/user-email";

export type TUserContact = { email: string | null; phoneNumber: string | null }

type TGetUserContact = (userId: string) => Promise<TUserContact>

// Only returns addresses that can actually receive a code: a real email (not the generated
// placeholder) and a phone number that was verified by OTP.
export const getUserContact: TGetUserContact = async (userId) => {
	const { rows } = await pool.query(
		`select email, "phoneNumber", "phoneNumberVerified" from "user" where id = $1`,
		[userId],
	)
	const user = rows[0]

	return {
		email: isPlaceholderEmail(user.email) ? null : user.email,
		phoneNumber: user.phoneNumberVerified ? user.phoneNumber : null,
	}
}
