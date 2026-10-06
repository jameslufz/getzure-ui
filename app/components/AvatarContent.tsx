"use client"

import { ReactNode, useState } from "react";
import { clientServiceUrl } from "@/app/lib/client-service";

type TAvatarContentProps = { imageVersion?: string; initial: string }
type TAvatarContent = (props: TAvatarContentProps) => ReactNode

// The user's profile picture; the initial shows when there is none or it can't be loaded.
export const AvatarContent: TAvatarContent = ({ imageVersion, initial }) => {
	const [failed, setFailed] = useState(false)
	if (!imageVersion || failed) return initial

	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={`${clientServiceUrl("/profile/image")}?v=${imageVersion}`}
			alt=""
			onError={() => setFailed(true)}
			className="h-full w-full object-cover"
		/>
	)
}
