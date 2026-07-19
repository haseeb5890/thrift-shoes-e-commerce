"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, UserRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export type AccountMenuUser = { name: string; email: string }

export function AccountMenu({ user, isAdmin }: { user: AccountMenuUser | null; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/")
    router.refresh()
  }

  if (!user) return <Link href="/sign-in" aria-label="Account" className="hidden sm:block"><UserRound size={20} /></Link>

  const items = isAdmin
    ? [
        { label: "My account", href: "/account" },
        { label: "Wishlist", href: "/wishlist" },
        { label: "Manage products", href: "/admin/products" },
        { label: "Manage orders", href: "/admin/orders" },
        { label: "Manage users", href: "/admin/users" },
      ]
    : [
        { label: "Orders", href: "/account" },
        { label: "Wishlist", href: "/wishlist" },
        { label: "Profile info", href: "/account" },
      ]

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold" aria-label="Account menu" aria-expanded={open}>
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
        <span className="max-w-[10rem] truncate">{user.name}</span>
        <ChevronDown size={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-border bg-background py-2 shadow-xl">
          {items.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm font-semibold hover:bg-secondary">{item.label}</Link>
          ))}
          <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm font-semibold text-destructive hover:bg-secondary">Logout</button>
        </div>
      )}
    </div>
  )
}