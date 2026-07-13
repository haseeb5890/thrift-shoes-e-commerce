"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router=useRouter(); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null); const [loading,setLoading]=useState(false); const signup=mode==="sign-up"
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setNotice(null); setLoading(true)
    const supabase = createClient()
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      setLoading(false)
      if (error) { setError(error.message); return }
      if (!data.session) { setNotice("Check your email to confirm your account, then sign in."); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) { setError(error.message); return }
    }
    router.push("/account"); router.refresh()
  }
  return <main className="grid min-h-svh md:grid-cols-2"><div className="hidden bg-primary p-12 text-primary-foreground md:flex md:flex-col md:justify-between"><Link href="/" className="font-serif text-3xl font-black">ReLace.</Link><div><p className="text-xs font-bold uppercase tracking-widest">Your better rotation</p><h1 className="mt-4 text-balance font-serif text-6xl font-black leading-none">Save pairs. Track orders. Wear longer.</h1></div><p className="text-sm text-primary-foreground/70">Curated thrift sneakers, delivered across Pakistan.</p></div><div className="flex items-center justify-center px-4 py-12"><div className="w-full max-w-sm"><Link href="/" className="font-serif text-2xl font-black md:hidden">ReLace.</Link><p className="mt-10 text-xs font-bold uppercase tracking-widest text-primary">{signup?"Join ReLace":"Welcome back"}</p><h2 className="mt-2 font-serif text-4xl font-black">{signup?"Create an account":"Sign in"}</h2><form onSubmit={submit} className="mt-8 flex flex-col gap-4">{signup&&<input className="h-12 border border-input bg-card px-3" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" required autoComplete="name"/>}<input className="h-12 border border-input bg-card px-3" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required autoComplete="email"/><input className="h-12 border border-input bg-card px-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password (8+ characters)" minLength={8} required autoComplete={signup?"new-password":"current-password"}/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{notice&&<p role="status" className="text-sm text-accent">{notice}</p>}<button disabled={loading} className="h-12 bg-primary font-bold text-primary-foreground">{loading?"Please wait...":signup?"Create account":"Sign in"}</button></form><p className="mt-6 text-center text-sm text-muted-foreground">{signup?"Already have an account? ":"New to ReLace? "}<Link className="font-bold text-foreground underline" href={signup?"/sign-in":"/sign-up"}>{signup?"Sign in":"Create account"}</Link></p></div></div></main>
}
