type TCopy = (text: string) => void

const copy: TCopy = (text) => {
	navigator.clipboard.writeText(text)
}

export default copy
