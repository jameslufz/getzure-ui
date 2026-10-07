"use client"

import { ReactNode, useEffect, useRef } from "react";

type TParallaxSceneProps = { className?: string; children: ReactNode }
type TParallaxScene = (props: TParallaxSceneProps) => ReactNode
type TParallaxLayerProps = { speed: number; className?: string; children?: ReactNode }
type TParallaxLayer = (props: TParallaxLayerProps) => ReactNode

// Writes the scroll distance to --py on the scene; layers read it, so scrolling never re-renders React.
export const ParallaxScene: TParallaxScene = ({ className, children }) => {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const scene = ref.current
		if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		let frame = 0
		const update = () => {
			frame = 0
			scene.style.setProperty("--py", String(Math.min(window.scrollY, scene.offsetHeight)))
		}
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update)
		}

		update()
		window.addEventListener("scroll", onScroll, { passive: true })
		return () => {
			window.removeEventListener("scroll", onScroll)
			cancelAnimationFrame(frame)
		}
	}, [])

	return (
		<div ref={ref} className={`relative isolate overflow-hidden ${className ?? ""}`}>
			{children}
		</div>
	)
}

// A positive speed drifts slower than the page (feels far away), a negative one faster (feels near).
export const ParallaxLayer: TParallaxLayer = ({ speed, className, children }) => {
	return (
		<div
			className={className}
			style={{
				transform: `translate3d(0, calc(var(--py, 0) * ${speed}px), 0)`,
				willChange: "transform",
			}}
		>
			{children}
		</div>
	)
}
