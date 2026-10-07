import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

type TRobots = () => MetadataRoute.Robots

// The dashboard, order links and API are private: crawlers are kept out of them.
const robots: TRobots = () => {
	return {
		rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/order/", "/api/"] },
		sitemap: `${SITE_URL}/sitemap.xml`,
	}
}

export default robots
