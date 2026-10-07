import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

type TSitemap = () => MetadataRoute.Sitemap

// Only the landing page is public content; everything else needs an account.
const sitemap: TSitemap = () => {
	return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }]
}

export default sitemap
