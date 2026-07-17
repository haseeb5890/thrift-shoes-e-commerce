import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth-form"

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "That sign-in link is invalid or has expired. Please try again.",
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/account")

  const { error } = await searchParams
  const initialError = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing you in. Please try again.") : undefined

  return <AuthForm mode="sign-in" initialError={initialError} />
}