import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

type TProxy = (request: NextRequest) => NextResponse

export const proxy: TProxy = (request) => {
	const sessionCookie = getSessionCookie(request)

	if (!sessionCookie) {
		const signInUrl = new URL("/sign-in", request.url)
		signInUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search)

		return NextResponse.redirect(signInUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/dashboard/:path*"],
}
