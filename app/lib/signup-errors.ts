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
	invalidPassword: {
		key: "auth.error.invalidPassword" as TranslationKey,
		th: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
	},
	sessionNotFresh: {
		key: "auth.error.sessionNotFresh" as TranslationKey,
		th: "เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่อีกครั้งก่อนทำรายการนี้",
	},
	invalidImage: {
		key: "auth.error.invalidImage" as TranslationKey,
		th: "รูปภาพต้องเป็นไฟล์ JPEG, PNG หรือ WebP",
	},
	imageTooLarge: {
		key: "auth.error.imageTooLarge" as TranslationKey,
		th: "ไฟล์รูปภาพใหญ่เกินไป (ไม่เกิน 5 MB)",
	},
	kycAlreadyVerified: {
		key: "auth.error.kycAlreadyVerified" as TranslationKey,
		th: "บัญชีของคุณยืนยันตัวตนแล้ว ไม่สามารถแก้ไขข้อมูลได้",
	},
	emailNotVerified: {
		key: "auth.error.emailNotVerified" as TranslationKey,
		th: "กรุณายืนยันอีเมลของคุณก่อนเปิดใช้งาน",
	},
	emailAlreadySet: {
		key: "auth.error.emailAlreadySet" as TranslationKey,
		th: "บัญชีนี้มีอีเมลที่ยืนยันแล้ว ไม่สามารถเปลี่ยนได้",
	},
	verifyMethodUnavailable: {
		key: "auth.error.verifyMethodUnavailable" as TranslationKey,
		th: "ช่องทางนี้ใช้ยืนยันไม่ได้ กรุณาเลือกช่องทางอื่น",
	},
	channelNotEnabled: {
		key: "auth.error.channelNotEnabled" as TranslationKey,
		th: "วิธีนี้ยังไม่ได้เปิดใช้งานในบัญชีของคุณ",
	},
	passwordRequired: {
		key: "auth.error.passwordRequired" as TranslationKey,
		th: "ต้องตั้งรหัสผ่านก่อนจึงจะทำรายการนี้ได้",
	},
	passkeyFailed: {
		key: "auth.error.passkeyFailed" as TranslationKey,
		th: "ยืนยันด้วย Passkey ไม่สำเร็จ ลองอีกครั้งหรือเลือกวิธีอื่น",
	},
	phoneAlreadySet: {
		key: "auth.error.phoneAlreadySet" as TranslationKey,
		th: "บัญชีนี้มีเบอร์โทรศัพท์ที่ยืนยันแล้ว ไม่สามารถเปลี่ยนได้",
	},
	invalidProductImage: {
		key: "auth.error.invalidProductImage" as TranslationKey,
		th: "รูปภาพต้องเป็นไฟล์ jpg, jpeg, png, webp หรือ avif",
	},
	tooManyImages: {
		key: "auth.error.tooManyImages" as TranslationKey,
		th: "อัปโหลดรูปภาพได้สูงสุด 5 รูป",
	},
	invalidCategory: {
		key: "auth.error.invalidCategory" as TranslationKey,
		th: "หมวดหมู่ที่เลือกใช้ไม่ได้ กรุณาเลือกใหม่",
	},
	noProducts: {
		key: "auth.error.noProducts" as TranslationKey,
		th: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ",
	},
	invalidProduct: {
		key: "auth.error.invalidProduct" as TranslationKey,
		th: "มีสินค้าที่ใช้ไม่ได้ กรุณาเอาออกแล้วลองใหม่",
	},
	outOfStock: {
		key: "auth.error.outOfStock" as TranslationKey,
		th: "สินค้ามีไม่พอ กรุณาลดจำนวนหรือเพิ่มสต็อกแล้วลองใหม่",
	},
	orderTotalTooLarge: {
		key: "auth.error.orderTotalTooLarge" as TranslationKey,
		th: "ยอดรวมของออเดอร์สูงเกินไป",
	},
	noPayer: {
		key: "auth.error.noPayer" as TranslationKey,
		th: "กรุณาระบุเบอร์โทรหรืออีเมลผู้ชำระ",
	},
	noOrderImage: {
		key: "auth.error.noOrderImage" as TranslationKey,
		th: "กรุณาเพิ่มภาพสินค้าที่พร้อมส่งอย่างน้อย 1 รูป",
	},
	invalidGuest: {
		key: "auth.error.invalidGuest" as TranslationKey,
		th: "ข้อมูลแขกไม่ถูกต้อง กรุณาตรวจเบอร์โทร ชื่อไทย ธนาคาร และเลขบัญชี",
	},
	tooManyProducts: {
		key: "auth.error.tooManyProducts" as TranslationKey,
		th: "เพิ่มสินค้าในออเดอร์ได้สูงสุด 20 รายการ",
	},
	invalidCustomer: {
		key: "auth.error.invalidCustomer" as TranslationKey,
		th: "เบอร์โทรศัพท์หรืออีเมลของผู้ชำระไม่ถูกต้อง",
	},
	cannotTagSelf: {
		key: "auth.error.cannotTagSelf" as TranslationKey,
		th: "ไม่สามารถระบุตัวเองเป็นผู้ชำระได้",
	},
	tooManyCustomers: {
		key: "auth.error.tooManyCustomers" as TranslationKey,
		th: "ออเดอร์มีผู้ชำระได้ 1 คน",
	},
	invalidOrderImage: {
		key: "auth.error.invalidOrderImage" as TranslationKey,
		th: "รูปภาพต้องเป็นไฟล์ jpg, jpeg, png, webp หรือ avif",
	},
	tooManyRequests: {
		key: "auth.error.tooManyRequests" as TranslationKey,
		th: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
	},
	validationError: {
		key: "auth.error.validationError" as TranslationKey,
		th: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
	},
} as const

export type TServerErrorKind = keyof typeof SERVER_ERROR_MESSAGES

// Covers every code from better-auth's PHONE_NUMBER_ERROR_CODES plus our own routes.
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
	INVALID_PASSWORD: "invalidPassword",
	SESSION_NOT_FRESH: "sessionNotFresh",
	PASSWORD_TOO_SHORT: "validationError",
	PASSWORD_TOO_LONG: "validationError",
	PASSWORD_ALREADY_SET: "generic",
	INVALID_IMAGE: "invalidImage",
	IMAGE_TOO_LARGE: "imageTooLarge",
	KYC_ALREADY_VERIFIED: "kycAlreadyVerified",
	INFO_REQUIRED: "generic",
	EMAIL_NOT_VERIFIED: "emailNotVerified",
	EMAIL_ALREADY_SET: "emailAlreadySet",
	INVALID_CODE: "invalidOtp",
	OTP_HAS_EXPIRED: "otpExpired",
	TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "tooManyAttempts",
	ACCOUNT_TEMPORARILY_LOCKED: "tooManyAttempts",
	INVALID_TWO_FACTOR_COOKIE: "unauthorized",
	INVALID_EMAIL: "validationError",
	VERIFY_METHOD_UNAVAILABLE: "verifyMethodUnavailable",
	CHANNEL_NOT_ENABLED: "channelNotEnabled",
	PASSWORD_REQUIRED: "passwordRequired",
	INVALID_BACKUP_CODE: "invalidOtp",
	USE_OTP_ROUTE: "generic",
	TOTP_NOT_ENABLED: "generic",
	TWO_FACTOR_REQUIRED: "unauthorized",
	PASSKEY_NOT_ALLOWED: "passkeyFailed",
	PHONE_ALREADY_SET: "phoneAlreadySet",
	INVALID_PRODUCT_IMAGE: "invalidProductImage",
	INVALID_PROFILE_IMAGE: "invalidProductImage",
	TOO_MANY_IMAGES: "tooManyImages",
	INVALID_CATEGORY: "invalidCategory",
	NO_PRODUCTS: "noProducts",
	INVALID_PRODUCT: "invalidProduct",
	DUPLICATE_PRODUCT: "invalidProduct",
	OUT_OF_STOCK: "outOfStock",
	ORDER_TOTAL_TOO_LARGE: "orderTotalTooLarge",
	TOO_MANY_PRODUCTS: "tooManyProducts",
	INVALID_CUSTOMER: "invalidCustomer",
	NO_PAYER: "noPayer",
	NO_ORDER_IMAGE: "noOrderImage",
	INVALID_GUEST: "invalidGuest",
	CANNOT_TAG_SELF: "cannotTagSelf",
	TOO_MANY_CUSTOMERS: "tooManyCustomers",
	INVALID_ORDER_IMAGE: "invalidOrderImage",
	TOO_MANY_REQUESTS: "tooManyRequests",
	INFO_ALREADY_EXISTS: "generic",
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

type TApiErrorBody = { code?: string }

type TAuthClientError = { code?: string; message?: string } | null | undefined
type TKindFromAuthClientError = (error: TAuthClientError) => TServerErrorKind

// Same mapping as parseApiErrorKind, for the `error` that better-auth's client methods return.
export const kindFromAuthClientError: TKindFromAuthClientError = (error) => {
	return (error?.code && SIGNUP_ERROR_CODE_MAP[error.code]) || "generic"
}

type TParseApiErrorKind = (res: Response) => Promise<TServerErrorKind>

export const parseApiErrorKind: TParseApiErrorKind = async (res) => {
	try {
		const body: TApiErrorBody = await res.json()
		return (body.code && SIGNUP_ERROR_CODE_MAP[body.code]) || "generic"
	} catch {
		return "generic"
	}
}
