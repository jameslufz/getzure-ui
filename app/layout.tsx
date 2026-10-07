import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/app/components/PwaRegister";
import { QueryProvider } from "@/app/components/QueryProvider";
import { Toaster } from "@/app/components/Toaster";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/lib/site";

const notoSansThai = Noto_Sans_Thai({
	variable: "--font-noto-sans-thai",
	subsets: ["thai"],
	weight: ["300", "500", "700"],
})

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	applicationName: SITE_NAME,
	title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = { themeColor: "#06262e" }

const themeInitScript = `(function () {
	try {
		var storedTheme = localStorage.getItem("theme");
		var isDark = storedTheme
			? storedTheme === "dark"
			: window.matchMedia("(prefers-color-scheme: dark)").matches;
		document.documentElement.classList.toggle("dark", isDark);

		var storedLang = localStorage.getItem("lang");
		document.documentElement.lang = storedLang === "th" ? "th" : "en";
	} catch (e) {}
})();`

const RootLayout = ({ children }: LayoutProps<"/">) => {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${notoSansThai.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<QueryProvider>{children}</QueryProvider>
				<Toaster />
				<PwaRegister />
			</body>
		</html>
	)
}

export default RootLayout
