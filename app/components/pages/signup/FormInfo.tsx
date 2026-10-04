import { T } from "@/app/i18n/T"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { ChangeEvent, ReactNode } from "react"
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form"
import z from "zod"
import { parseApiErrorKind, SignupApiError, type TServerErrorKind } from "@/app/lib/signup-errors"
import { Select } from "@/app/components/Select"
import { useLanguage } from "@/app/i18n/useLanguage"

const BANK_OPTIONS = [
	{ value: "kbank", label: "ธนาคารกสิกรไทย" },
	{ value: "scb", label: "ธนาคารไทยพาณิชย์" },
	{ value: "bbl", label: "ธนาคารกรุงเทพ" },
	{ value: "ktb", label: "ธนาคารกรุงไทย" },
	{ value: "bay", label: "ธนาคารกรุงศรีอยุธยา" },
	{ value: "ttb", label: "ธนาคารทหารไทยธนชาต" },
	{ value: "gsb", label: "ธนาคารออมสิน" },
	{ value: "baac", label: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร" },
	{ value: "cimb", label: "ธนาคารซีไอเอ็มบีไทย" },
	{ value: "uob", label: "ธนาคารยูโอบี" },
]

type TFormInfoProps = {
    isLoading: boolean;

    fieldClass: (hasError: boolean) => string;
    setServerError: (v: TServerErrorKind | null) => void;
    setLoading: (v: boolean) => void;
    clearOtpStorage: () => void;
}
type TFormInfo = (props: TFormInfoProps) => ReactNode

const THAI_NAME_PATTERN = /^[ก-ฺเ-๎\s]*$/
const ENGLISH_NAME_PATTERN = /^[A-Za-z\s]*$/
const DIGITS_PATTERN = /^\d*$/

const infoFormSchema = z.object({
	nameTh: z
		.string({ error: "กรุณากรอกชื่อภาษาไทย" })
		.min(1, { error: "กรุณากรอกชื่อภาษาไทย" })
		.regex(THAI_NAME_PATTERN, { error: "กรอกได้เฉพาะตัวอักษรภาษาไทยเท่านั้น" }),
	nameEn: z
		.string({ error: "กรุณากรอกชื่อภาษาอังกฤษ" })
		.min(1, { error: "กรุณากรอกชื่อภาษาอังกฤษ" })
		.regex(ENGLISH_NAME_PATTERN, { error: "กรอกได้เฉพาะตัวอักษรภาษาอังกฤษเท่านั้น" }),
	bank: z.string({ error: "กรุณาเลือกธนาคาร" }).min(1, { error: "กรุณาเลือกธนาคาร" }),
	bankAccountNo: z
		.string({ error: "กรุณากรอกหมายเลขบัญชี" })
		.min(1, { error: "กรุณากรอกหมายเลขบัญชี" })
		.regex(DIGITS_PATTERN, { error: "กรอกได้เฉพาะตัวเลขเท่านั้น" }),
})

export type TInfoForm = z.infer<typeof infoFormSchema>

const FormInfo: TFormInfo = ({ isLoading, fieldClass, setServerError, setLoading, clearOtpStorage }) =>
{
    const router = useRouter()
	const lang = useLanguage()
	const infoForm = useForm<TInfoForm>({
		resolver: zodResolver(infoFormSchema),
		defaultValues: { bank: BANK_OPTIONS[0].value },
	})
	const nameThField = infoForm.register("nameTh")
	const nameEnField = infoForm.register("nameEn")
	const bankAccountNoField = infoForm.register("bankAccountNo")
	const nameThValue = useWatch({ control: infoForm.control, name: "nameTh" })

	const handleFilteredChange = (
		field: { onChange: (e: ChangeEvent<HTMLInputElement>) => void },
		pattern: RegExp,
	) => (e: ChangeEvent<HTMLInputElement>) => {
		e.target.value = Array.from(e.target.value)
			.filter((char) => pattern.test(char))
			.join("")
		field.onChange(e)
	}

    const handleSubmitInfo: SubmitHandler<TInfoForm> = async (data) =>
    {
        setServerError(null)
        setLoading(true)
        try {
            const res = await fetch("/api/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new SignupApiError(await parseApiErrorKind(res))
            clearOtpStorage()
            router.push("/dashboard")
        } catch (err) {
            setLoading(false)
            setServerError(err instanceof SignupApiError ? err.kind : "generic")
        }
    }

    return (
        <form
            onSubmit={infoForm.handleSubmit(handleSubmitInfo)}
            className="space-y-4"
            noValidate
        >
            <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase before:content-['Personal_information'] th:before:content-['ข้อมูลส่วนตัว'] dark:text-zinc-500" />

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.nameTh">ชื่อภาษาไทย</T> <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    autoFocus
                    placeholder={lang === "th" ? "เช่น สมชาย ใจดี" : "e.g. สมชาย ใจดี"}
                    {...nameThField}
                    onChange={handleFilteredChange(nameThField, THAI_NAME_PATTERN)}
                    className={fieldClass(!!infoForm.formState.errors.nameTh)}
                />
                {infoForm.formState.errors.nameTh && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {infoForm.formState.errors.nameTh.message || "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.nameEn">ชื่อภาษาอังกฤษ</T> <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder={lang === "th" ? "เช่น Somchai Jaidee" : "e.g. Somchai Jaidee"}
                    {...nameEnField}
                    onChange={handleFilteredChange(nameEnField, ENGLISH_NAME_PATTERN)}
                    className={fieldClass(!!infoForm.formState.errors.nameEn)}
                />
                {infoForm.formState.errors.nameEn && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {infoForm.formState.errors.nameEn.message || "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <div className="pt-2 text-xs font-medium tracking-wide text-zinc-400 uppercase before:content-['Bank_account'] th:before:content-['บัญชีธนาคาร'] dark:text-zinc-500" />

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.bank">ธนาคาร</T> <span className="text-red-500">*</span>
                </label>
                <Controller
                    name="bank"
                    control={infoForm.control}
                    render={({ field }) => (
                        <Select
                            value={field.value || ""}
                            onChange={field.onChange}
                            options={BANK_OPTIONS}
                        />
                    )}
                />
                {infoForm.formState.errors.bank && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {infoForm.formState.errors.bank.message || "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.bankAccountNo">หมายเลขบัญชี</T> <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder={lang === "th" ? "เช่น 1234567890" : "e.g. 1234567890"}
                    {...bankAccountNoField}
                    onChange={handleFilteredChange(bankAccountNoField, DIGITS_PATTERN)}
                    className={fieldClass(!!infoForm.formState.errors.bankAccountNo)}
                />
                {infoForm.formState.errors.bankAccountNo && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {infoForm.formState.errors.bankAccountNo.message || "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.bankAccountName">ชื่อบัญชีธนาคาร</T>
                </label>
                <input
                    type="text"
                    readOnly
                    value={nameThValue || ""}
                    placeholder={
                        lang === "th"
                            ? "จะเติมให้อัตโนมัติจากชื่อภาษาไทยด้านบน"
                            : "Auto-filled from the Thai name above"
                    }
                    className={fieldClass(false) + " cursor-not-allowed border-dashed bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}
                />
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <T k="auth.form.bankAccountNameHint">
                        ชื่อบัญชีต้องตรงกับชื่อที่ใช้สมัครเท่านั้น
                    </T>
                </p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
                <T k="auth.signUp.info.submit">ดำเนินการต่อ</T>
            </button>
        </form>
    )
}

export default FormInfo