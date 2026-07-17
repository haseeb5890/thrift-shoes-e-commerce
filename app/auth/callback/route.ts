import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { getOrCreateProfile } from "@/lib/profiles"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    const user = data?.user

    if (!error && user?.email) {
      // Link this auth session to a profile by email — creating one if this is genuinely
      // their first time (no prior guest checkout), or claiming an existing guest profile
      // (and every order under it) if the email matches one.
      await getOrCreateProfile(db, {
        email: user.email,
        authUserId: user.id,
        fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      })
      return NextResponse.redirect(`${origin}/account`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`)
}