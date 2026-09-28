import { T } from "@/app/i18n/T"
import { TProfileForm } from "@/app/sign-up/page"
import { useRouter } from "next/navigation"
import { ReactNode } from "react"
import { SubmitHandler, UseFormReturn } from "react-hook-form"

type TFormProfileProps = {
    isLoading: boolean;
    profileForm: UseFormReturn<TProfileForm>;

    fieldClass: (hasError: boolean) => string;
    setServerError: (v: boolean) => void;
    setLoading: (v: boolean) => void;
}
type TFormProfile = (props: TFormProfileProps) => ReactNode
const FormProfile: TFormProfile = ({ isLoading, profileForm, fieldClass, setServerError, setLoading }) =>
{
    const router = useRouter()
    const handleSubmitProfile: SubmitHandler<TProfileForm> = async (data) =>
    {
        setServerError(false)
        setLoading(true)
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error("failed to save profile")
            router.push("/dashboard")
        } catch {
            setLoading(false)
            setServerError(true)
        }
    }

    return (
        <form
            onSubmit={profileForm.handleSubmit(handleSubmitProfile)}
            className="space-y-4"
            noValidate
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.firstname">ชื่อจริง</T>
                </label>
                <input
                    type="text"
                    autoFocus
                    {...profileForm.register("firstname")}
                    className={fieldClass(!!profileForm.formState.errors.firstname)}
                />
                {profileForm.formState.errors.firstname && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {profileForm.formState.errors.firstname.message ||
                                "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.middlename">ชื่อกลาง (ไม่บังคับ)</T>
                </label>
                <input
                    type="text"
                    {...profileForm.register("middlename")}
                    className={fieldClass(false)}
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <T k="auth.form.lastname">นามสกุล</T>
                </label>
                <input
                    type="text"
                    {...profileForm.register("lastname")}
                    className={fieldClass(!!profileForm.formState.errors.lastname)}
                />
                {profileForm.formState.errors.lastname && (
                    <p className="mt-1 text-xs text-rose-500">
                        <T k="auth.form.error.required">
                            {profileForm.formState.errors.lastname.message ||
                                "กรุณากรอกข้อมูลนี้"}
                        </T>
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
                <T k="auth.signUp.profile.submit">ดำเนินการต่อ</T>
            </button>
        </form>
    )
}

export default FormProfile