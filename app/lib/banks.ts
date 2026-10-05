import { BANK_CODES, TBankCode } from "@/app/lib/validation";

export const BANK_LABELS: Record<TBankCode, string> = {
	kbank: "ธนาคารกสิกรไทย",
	scb: "ธนาคารไทยพาณิชย์",
	bbl: "ธนาคารกรุงเทพ",
	ktb: "ธนาคารกรุงไทย",
	bay: "ธนาคารกรุงศรีอยุธยา",
	ttb: "ธนาคารทหารไทยธนชาต",
	gsb: "ธนาคารออมสิน",
	baac: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
	cimb: "ธนาคารซีไอเอ็มบีไทย",
	uob: "ธนาคารยูโอบี",
}

export const BANK_OPTIONS = BANK_CODES.map((code) => ({ value: code, label: BANK_LABELS[code] }))
