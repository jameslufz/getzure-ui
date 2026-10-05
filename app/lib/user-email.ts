// Phone sign-ups get a generated address because better-auth requires an email on every user.
// It can't receive mail, so anything that needs a real inbox must treat it as "no email".
const PLACEHOLDER_EMAIL_DOMAIN = "@phone.getzure.com"

type TCreatePlaceholderEmail = (phoneNumber: string) => string
type TIsPlaceholderEmail = (email: string) => boolean

export const createPlaceholderEmail: TCreatePlaceholderEmail = (phoneNumber) => {
	return `${phoneNumber}${PLACEHOLDER_EMAIL_DOMAIN}`
}

export const isPlaceholderEmail: TIsPlaceholderEmail = (email) => {
	return email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_DOMAIN)
}
