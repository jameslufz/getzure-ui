export const translations = {
	"nav.group.personal": { en: "Personal", th: "ส่วนตัว" },
	"nav.personal.dashboard": { en: "Dashboard", th: "แดชบอร์ด" },
	"nav.personal.changePassword": {
		en: "Change Password",
		th: "เปลี่ยนรหัสผ่าน",
	},
	"nav.personal.verification": {
		en: "Identity Verification",
		th: "การยืนยันตัวตน",
	},
	"nav.group.payment": { en: "Payment", th: "การชำระเงิน" },
	"nav.createPaymentLink": {
		en: "Create Payment Link",
		th: "สร้างลิงก์ชำระเงิน",
	},
	"header.title": { en: "Dashboard", th: "แดชบอร์ด" },
	"header.search": { en: "Search...", th: "ค้นหา..." },

	"paymentLink.back": { en: "Back to Payment", th: "กลับไปที่การชำระเงิน" },
	"paymentLink.title": {
		en: "Create Payment Link",
		th: "สร้างลิงก์ชำระเงิน",
	},
	"paymentLink.subtitle": {
		en: "Create a shareable link your customer can use to pay you.",
		th: "สร้างลิงก์เพื่อส่งให้ลูกค้าใช้ชำระเงินให้คุณ",
	},
	"paymentLink.form.title": { en: "Payment title", th: "ชื่อรายการชำระเงิน" },
	"paymentLink.form.amount": { en: "Amount", th: "จำนวนเงิน" },
	"paymentLink.form.currency": { en: "Currency", th: "สกุลเงิน" },
	"paymentLink.form.descriptionOptional": {
		en: "Description (optional)",
		th: "รายละเอียด (ไม่บังคับ)",
	},
	"paymentLink.form.expiresAt": {
		en: "Expires on (optional)",
		th: "วันหมดอายุ (ไม่บังคับ)",
	},
	"paymentLink.form.customerEmail": {
		en: "Customer email (optional)",
		th: "อีเมลลูกค้า (ไม่บังคับ)",
	},
	"paymentLink.form.customerEmailHint": {
		en: "We'll send the link to this address",
		th: "เราจะส่งลิงก์ไปยังอีเมลนี้",
	},
	"paymentLink.form.submit": {
		en: "Create Payment Link",
		th: "สร้างลิงก์ชำระเงิน",
	},
	"paymentLink.form.reset": {
		en: "Create another",
		th: "สร้างลิงก์อีกครั้ง",
	},
	"paymentLink.form.error.required": {
		en: "This field is required",
		th: "กรุณากรอกข้อมูลนี้",
	},
	"paymentLink.form.error.minAmount": {
		en: "Amount must be greater than 0",
		th: "จำนวนเงินต้องมากกว่า 0",
	},
	"paymentLink.form.error.invalidEmail": {
		en: "Enter a valid email address",
		th: "กรุณากรอกอีเมลที่ถูกต้อง",
	},
	"paymentLink.preview.label": { en: "Preview", th: "ตัวอย่าง" },
	"paymentLink.preview.hint": {
		en: "This is what your customer will see",
		th: "นี่คือสิ่งที่ลูกค้าของคุณจะเห็น",
	},
	"paymentLink.preview.untitled": {
		en: "Untitled payment",
		th: "ยังไม่มีชื่อรายการ",
	},
	"paymentLink.preview.payButton": { en: "Pay now", th: "ชำระเงินตอนนี้" },
	"paymentLink.success.title": {
		en: "Payment link created",
		th: "สร้างลิงก์ชำระเงินสำเร็จ",
	},
	"paymentLink.success.copy": { en: "Copy", th: "คัดลอก" },
	"paymentLink.success.copied": { en: "Copied", th: "คัดลอกแล้ว" },
} as const

export type TranslationKey = keyof typeof translations
