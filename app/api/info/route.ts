import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { pool } from "@/app/lib/db";

export const GET = async (request: NextRequest) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ hasSession: false, infoComplete: false })
	}

	const { rows } = await pool.query(`select 1 from user_info where user_id = $1`, [session.user.id])

	return NextResponse.json({ hasSession: true, infoComplete: rows.length > 0 })
}

export const POST = async (request: NextRequest) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
	}

	const { nameTh, nameEn, bank, bankAccountNo } = await request.json()

	if (!nameTh || !nameEn || !bank || !bankAccountNo) {
		return NextResponse.json(
			{ message: "nameTh, nameEn, bank and bankAccountNo are required", code: "VALIDATION_ERROR" },
			{ status: 400 },
		)
	}

	// The bank account name is never taken from the client — it's always
	// derived from the Thai name just submitted, so it can never diverge
	// from the registered name (the UI's readonly field is a convenience,
	// not the actual enforcement).
	await pool.query(
		`insert into user_info (user_id, full_name_th, full_name_en, bank, bank_account_no, bank_acocunt_name)
		 values ($1, $2, $3, $4, $5, $2)
		 on conflict (user_id) do update
		 set full_name_th = $2, full_name_en = $3, bank = $4, bank_account_no = $5, bank_acocunt_name = $2`,
		[session.user.id, nameTh, nameEn, bank, bankAccountNo],
	)

	return NextResponse.json({ message: "saved" })
}
