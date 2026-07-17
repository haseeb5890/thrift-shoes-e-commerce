"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }
  return <button onClick={signOut} className={className ?? "text-sm font-bold underline"}>Sign out</button>
}
