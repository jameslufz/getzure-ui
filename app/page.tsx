import type { Metadata } from "next";
import { ReactNode } from "react";
import Hero from "@/app/components/landing/Hero";
import LandingFooter from "@/app/components/landing/LandingFooter";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/app/lib/site";

type THome = () => ReactNode

export const metadata: Metadata = {
	title: { absolute: SITE_TITLE },
	description: SITE_DESCRIPTION,
	keywords: ["getZure", "ระบบชำระเงิน", "ตัวกลางชำระเงิน", "ลิงก์ชำระเงิน", "ซื้อขายออนไลน์"],
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		url: "/",
		siteName: SITE_NAME,
		locale: "th_TH",
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
	},
	twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
}

// Tells search engines who runs the site; the text is fixed, so it is safe to inline.
const structuredData = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
			logo: `${SITE_URL}/logo-dark.png`,
			description: SITE_DESCRIPTION,
		},
		{ "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "th" },
	],
}

const Home: THome = () => {
	return (
		<div className="dark bg-[#020a0d] text-white">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
				}}
			/>
			<Hero />
			<LandingFooter />
		</div>
	)
}

export default Home
