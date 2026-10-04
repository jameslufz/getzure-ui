"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { authClient } from "@/app/lib/auth-client";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { T } from "@/app/i18n/T";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";

type FormValues = {
	email: string
	password: string
}

const fieldClass = (hasError: boolean) => {
	return `w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-hidden focus:ring-2 dark:bg-zinc-900 dark:text-zinc-50 ${
		hasError
			? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
			: "border-zinc-200 focus:border-teal-500 focus:ring-teal-500/20 dark:border-zinc-700"
	}`
}

const SignInPage = () => {
	const router = useRouter()
	const [serverError, setServerError] = useState(false)
	const [loading, setLoading] = useState(false)
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>()

	const onSubmit = (data: FormValues) => {
		setServerError(false)
		setLoading(true)
		authClient.signIn.email(
			{ email: data.email, password: data.password },
			{
				onSuccess: () => router.push("/dashboard"),
				onError: () => {
					setLoading(false)
					setServerError(true)
				},
			},
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
			<div className="absolute top-4 right-4 flex items-center gap-2">
				<LanguageToggle />
				<ThemeToggle />
			</div>

			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3 text-center">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-600 text-sm font-bold text-white">
						G
					</div>
					<div>
						<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
							<T k="auth.signIn.title">เข้าสู่ระบบ</T>
						</h1>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
							<T k="auth.signIn.subtitle">ยินดีต้อนรับกลับสู่ Getzure</T>
						</p>
					</div>
				</div>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
					noValidate
				>
					{serverError && (
						<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
							<T k="auth.error.generic">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</T>
						</p>
					)}

					<div>
						<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
							<T k="auth.form.email">อีเมล</T>
						</label>
						<input
							type="email"
							{...register("email", {
								required: true,
								pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
							})}
							className={fieldClass(!!errors.email)}
						/>
						{errors.email && (
							<p className="mt-1 text-xs text-rose-500">
								{errors.email.type === "pattern" ? (
									<T k="auth.form.error.invalidEmail">กรุณากรอกอีเมลที่ถูกต้อง</T>
								) : (
									<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
								)}
							</p>
						)}
					</div>

					<div>
						<label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
							<T k="auth.form.password">รหัสผ่าน</T>
						</label>
						<input
							type="password"
							{...register("password", { required: true })}
							className={fieldClass(!!errors.password)}
						/>
						{errors.password && (
							<p className="mt-1 text-xs text-rose-500">
								<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
					>
						<T k="auth.signIn.submit">เข้าสู่ระบบ</T>
					</button>

					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							<T k="auth.orContinueWith">หรือดำเนินการต่อด้วย</T>
						</span>
						<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
					</div>

					<GoogleSignInButton callbackURL="/sign-up" />
				</form>

				<p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
					<T k="auth.signIn.noAccount">ยังไม่มีบัญชี?</T>{" "}
					<Link href="/sign-up" className="font-medium text-teal-600 dark:text-teal-400">
						<T k="auth.signIn.createAccount">สมัครสมาชิก</T>
					</Link>
				</p>
			</div>
		</div>
	)
}

export default SignInPage
