import type { TranslationKey } from "@/app/i18n/translations";

export const SERVER_ERROR_MESSAGES = {
	generic: {
		key: "auth.error.generic" as TranslationKey,
		th: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
	},
	invalidOtp: {
		key: "auth.error.invalidOtp" as TranslationKey,
		th: "รหัส OTP ไม่ถูกต้อง",
	},
	otpExpired: {
		key: "auth.error.otpExpired" as TranslationKey,
		th: "รหัส OTP หมดอายุ กรุณาขอรหัสใหม่",
	},
	otpNotFound: {
		key: "auth.error.otpNotFound" as TranslationKey,
		th: "ไม่พบคำขอ OTP กรุณาขอรหัสใหม่อีกครั้ง",
	},
	tooManyAttempts: {
		key: "auth.error.tooManyAttempts" as TranslationKey,
		th: "กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่",
	},
	invalidPhoneNumber: {
		key: "auth.error.invalidPhoneNumber" as TranslationKey,
		th: "หมายเลขเบอร์โทรศัพท์ไม่ถูกต้อง",
	},
	phoneNumberExists: {
		key: "auth.error.phoneNumberExists" as TranslationKey,
		th: "เบอร์โทรศัพท์นี้ถูกใช้สมัครไปแล้ว",
	},
	unauthorized: {
		key: "auth.error.unauthorized" as TranslationKey,
		th: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
	},
	validationError: {
		key: "auth.error.validationError" as TranslationKey,
		th: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
	},
} as const

export type TServerErrorKind = keyof typeof SERVER_ERROR_MESSAGES

// Covers every error `code` the phone-number plugin's send-otp/verify
// endpoints can throw (see better-auth's PHONE_NUMBER_ERROR_CODES), plus
// our own custom API routes' codes — so no server error falls through
// without an explicit (even if "generic") mapping.
export const SIGNUP_ERROR_CODE_MAP: Record<string, TServerErrorKind> = {
	INVALID_OTP: "invalidOtp",
	OTP_EXPIRED: "otpExpired",
	OTP_NOT_FOUND: "otpNotFound",
	TOO_MANY_ATTEMPTS: "tooManyAttempts",
	INVALID_PHONE_NUMBER: "invalidPhoneNumber",
	PHONE_NUMBER_EXIST: "phoneNumberExists",
	PHONE_NUMBER_NOT_EXIST: "generic",
	INVALID_PHONE_NUMBER_OR_PASSWORD: "generic",
	PHONE_NUMBER_NOT_VERIFIED: "generic",
	PHONE_NUMBER_CANNOT_BE_UPDATED: "generic",
	SEND_OTP_NOT_IMPLEMENTED: "generic",
	UNEXPECTED_ERROR: "generic",
	VALIDATION_ERROR: "validationError",
	UNAUTHORIZED: "unauthorized",
}

export class SignupApiError extends Error {
	kind: TServerErrorKind
	constructor(kind: TServerErrorKind) {
		super(kind)
		this.kind = kind
	}
}

export const parseApiErrorKind = async (res: Response): Promise<TServerErrorKind> => {
	try {
		const body: { code?: string } = await res.json()
		return (body.code && SIGNUP_ERROR_CODE_MAP[body.code]) || "generic"
	} catch {
		return "generic"
	}
}
