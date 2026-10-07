import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/app/lib/site";

type TManifest = () => MetadataRoute.Manifest

const BRAND_COLOR = "#06262e"

const manifest: TManifest = () => {
	return {
		id: "/",
		name: SITE_NAME,
		short_name: SITE_NAME,
		description: SITE_DESCRIPTION,
		lang: "th",
		start_url: "/dashboard",
		scope: "/",
		display: "standalone",
		background_color: BRAND_COLOR,
		theme_color: BRAND_COLOR,
		categories: ["finance", "business"],
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{
				src: "/icons/maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
		shortcuts: [
			{ name: "สร้างออเดอร์", url: "/dashboard/orders/create" },
			{ name: "ออเดอร์", url: "/dashboard/orders" },
		],
	}
}

export default manifest
