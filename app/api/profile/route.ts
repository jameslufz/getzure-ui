import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { pool } from "@/app/lib/db";

export const POST = async (request: NextRequest) => {
	const session = await auth.api.getSession({ headers: request.headers })

	if (!session) {
		return NextResponse.json({ message: "unauthorized" }, { status: 401 })
	}

	const { firstname, middlename, lastname } = await request.json()

	if (!firstname || !lastname) {
		return NextResponse.json({ message: "firstname and lastname are required" }, { status: 400 })
	}

	await pool.query(
		`insert into user_info (user_id, firstname, middlename, lastname) values ($1, $2, $3, $4)
		 on conflict (user_id) do update set firstname = $2, middlename = $3, lastname = $4`,
		[session.user.id, firstname, middlename || null, lastname],
	)

	return NextResponse.json({ message: "saved" })
}
