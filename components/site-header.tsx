"use client"

import Link from "next/link"
import { Menu, ShoppingBag, X } from "lucide-react"
import { useState } from "react"
import { useStore } from "@/components/store-provider"
import { SearchBar } from "@/components/search-bar"
import { AccountMenu, type AccountMenuUser } from "@/components/account-menu"
import { Logo } from "@/components/logo"

export function SiteHeader({ user, isAdmin }: { user: AccountMenuUser | null; isAdmin: boolean }) {
  const { cartCount, setCartOpen } = useStore()
  const [open, setOpen] = useState(false)
  return <>
    <div className="bg-primary px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-primary-foreground">Professionally cleaned · Nationwide delivery · One pair only</div>
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={22}/> : <Menu size={22}/>}</button>
        <Logo size="h-16"/>
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex"><Link href="/shop">New drops</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Court">Court</Link><Link href="/shop?category=Trail">Trail</Link><Link href="/about">Our process</Link></nav>
        <div className="flex items-center gap-4"><SearchBar/><AccountMenu user={user} isAdmin={isAdmin}/><button className="relative" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={21}/><span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{cartCount}</span></button></div>
      </div>
      {open && <nav className="flex flex-col gap-4 border-t border-border px-4 py-5 text-sm font-semibold md:hidden"><Link href="/shop">Shop all</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Trail">Trail</Link><Link href="/about">Our process</Link><Link href="/account">Account</Link></nav>}
    </header>
  </>
}
