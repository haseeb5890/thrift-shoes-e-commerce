"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { linkCurrentUserProfile } from "@/app/actions/profile-link"
import { Logo } from "@/components/logo"

export function AuthForm({ mode, initialError }: { mode: "sign-in" | "sign-up"; initialError?: string }) {
  const router=useRouter(); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState<string|null>(initialError ?? null); const [notice,setNotice]=useState<string|null>(null); const [loading,setLoading]=useState(false); const signup=mode==="sign-up"
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setNotice(null); setLoading(true)
    const supabase = createClient()
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (error) { setLoading(false); setError(error.message); return }
      if (!data.session) { setLoading(false); setNotice("Check your email to confirm your account, then sign in."); return }
      // Email confirmation is disabled on this project, so a session exists immediately —
      // that means /auth/callback never runs, so we link the profile here instead.
      await linkCurrentUserProfile()
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setLoading(false); setError(error.message); return }
      // Password sign-in never redirects through /auth/callback, so link explicitly here too.
      await linkCurrentUserProfile()
    }
    setLoading(false)
    router.push("/account"); router.refresh()
  }
  async function continueWithGoogle() {
    setError(null); setNotice(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) setError(error.message)
  }
  return <main className="grid min-h-svh md:grid-cols-2"><div className="hidden bg-primary p-12 text-primary-foreground md:flex md:flex-col md:justify-between"><Logo variant="secondary" size="h-20"/><div><p className="text-xs font-bold uppercase tracking-widest">Your better rotation</p><h1 className="mt-4 text-balance text-6xl font-black leading-none">Save pairs. Track orders. Wear longer.</h1></div><p className="text-sm text-primary-foreground/70">Curated thrift sneakers, delivered across Pakistan.</p></div><div className="flex items-center justify-center px-4 py-12"><div className="w-full max-w-sm"><Logo wrapperClassName="md:hidden"/><p className="mt-10 text-xs font-bold uppercase tracking-widest text-primary">{signup?"Join Prime Soles":"Welcome back"}</p><h2 className="mt-2 text-4xl font-black">{signup?"Create an account":"Sign in"}</h2><form onSubmit={submit} className="mt-8 flex flex-col gap-4">{signup&&<input className="h-12 border border-input bg-card px-3" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" required autoComplete="name"/>}<input className="h-12 border border-input bg-card px-3" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required autoComplete="email"/><input className="h-12 border border-input bg-card px-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password (8+ characters)" minLength={8} required autoComplete={signup?"new-password":"current-password"}/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{notice&&<p role="status" className="text-sm text-accent">{notice}</p>}<button disabled={loading} className="h-12 bg-primary font-bold text-primary-foreground">{loading?"Please wait...":signup?"Create account":"Sign in"}</button></form><div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-border"/>Or<span className="h-px flex-1 bg-border"/></div><button type="button" onClick={continueWithGoogle} className="mt-5 flex h-12 w-full items-center justify-center gap-3 border border-input bg-card font-bold"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/></svg>Continue with Google</button><p className="mt-6 text-center text-sm text-muted-foreground">{signup?"Already have an account? ":"New to Prime Soles? "}<Link className="font-bold text-foreground underline" href={signup?"/sign-in":"/sign-up"}>{signup?"Sign in":"Create account"}</Link></p></div></div></main>
}
