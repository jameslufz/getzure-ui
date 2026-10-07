import { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";

type TLogoProps = { className?: string }
type TLogo = (props: TLogoProps) => ReactNode

const LOGO_WIDTH = 1000
const LOGO_HEIGHT = 230

// The dark logo shows in the light theme and the light logo in the dark theme; set the height with className.
const Logo: TLogo = ({ className }) => {
	return (
		<>
			<Image
				src="/logo-dark.png"
				alt="getZure"
				width={LOGO_WIDTH}
				height={LOGO_HEIGHT}
				className={clsx("w-auto dark:hidden", className)}
			/>
			<Image
				src="/logo-light.png"
				alt=""
				width={LOGO_WIDTH}
				height={LOGO_HEIGHT}
				className={clsx("hidden w-auto dark:block", className)}
			/>
		</>
	)
}

export default Logo
