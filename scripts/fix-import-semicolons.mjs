// Prettier is configured with semi:false project-wide, but this repo keeps
// semicolons on import statements. Prettier has no "semicolons on imports
// only" option, so this script re-adds them after every format run.
import { readFileSync, writeFileSync, globSync } from "node:fs"

const files = globSync(["app/**/*.{ts,tsx}", "*.{ts,mjs}"])

const importLine = /^(import (?:type )?.*from "[^"]+")$/
const sideEffectImportLine = /^(import "[^"]+")$/

for (const file of files) {
	const content = readFileSync(file, "utf8")
	const fixed = content
		.split("\n")
		.map((line) => {
			if (importLine.test(line) || sideEffectImportLine.test(line)) {
				return `${line};`
			}
			return line
		})
		.join("\n")

	if (fixed !== content) writeFileSync(file, fixed)
}
