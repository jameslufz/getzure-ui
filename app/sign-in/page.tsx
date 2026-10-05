"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/app/lib/auth-client";
import { appendRedirect, getRedirectFromLocation } from "@/app/lib/session";
import { AuthShell } from "@/app/components/AuthShell";
import { FormField } from "@/app/components/FormField";
import { OrDivider } from "@/app/components/OrDivider";
import { T } from "@/app/i18n/T";
import { getQueryClient } from "@/app/lib/query-client";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";

type FormValues = {
	email: string
	password: string
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

	const onSubmit: SubmitHandler<FormValues> = (data) => {
		setServerError(false)
		setLoading(true)
		authClient.signIn.email(
			{ email: data.email, password: data.password },
			{
				onSuccess: (ctx) => {
					// A new sign-in starts with an empty cache, so nothing of a previous user shows.
					getQueryClient().clear()
					router.push(
						ctx.data.twoFactorRedirect
							? appendRedirect("/sign-in/two-factor")
							: (getRedirectFromLocation() ?? "/dashboard"),
					)
				},
				onError: () => {
					setLoading(false)
					setServerError(true)
				},
			},
		)
	}

	return (
		<AuthShell
			title={<T k="auth.signIn.title">เข้าสู่ระบบ</T>}
			subtitle={<T k="auth.signIn.subtitle">ยินดีต้อนรับกลับสู่ Getzure</T>}
			footer={
				<>
					<T k="auth.signIn.noAccount">ยังไม่มีบัญชี?</T>{" "}
					<Link href="/sign-up" className="link">
						<T k="auth.signIn.createAccount">สมัครสมาชิก</T>
					</Link>
				</>
			}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
				{serverError && (
					<p className="alert-error">
						<T k="auth.error.generic">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</T>
					</p>
				)}

				<FormField
					label={<T k="auth.form.email">อีเมล</T>}
					error={
						errors.email &&
						(errors.email.type === "pattern" ? (
							<T k="auth.form.error.invalidEmail">กรุณากรอกอีเมลที่ถูกต้อง</T>
						) : (
							<T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
						))
					}
				>
					<input
						type="email"
						{...register("email", {
							required: true,
							pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
						})}
						aria-invalid={!!errors.email}
						className="input"
					/>
				</FormField>

				<FormField
					label={<T k="auth.form.password">รหัสผ่าน</T>}
					error={
						errors.password && <T k="auth.form.error.required">กรุณากรอกข้อมูลนี้</T>
					}
				>
					<input
						type="password"
						{...register("password", { required: true })}
						aria-invalid={!!errors.password}
						className="input"
					/>
				</FormField>

				<button type="submit" disabled={loading} className="btn-primary w-full">
					<T k="auth.signIn.submit">เข้าสู่ระบบ</T>
				</button>

				<OrDivider />

				<GoogleSignInButton callbackURL="/sign-up" />
			</form>
		</AuthShell>
	)
}

export default SignInPage
