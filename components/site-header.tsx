"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { SearchBar } from "@/components/search-bar"
import { AccountMenu, type AccountMenuUser } from "@/components/account-menu"
import { MobileNavDrawer } from "@/components/mobile-nav-drawer"
import { HelpMenu } from "@/components/help-menu"
import { Logo } from "@/components/logo"

export function SiteHeader({ user, isAdmin }: { user: AccountMenuUser | null; isAdmin: boolean }) {
  const { cartCount, setCartOpen } = useStore()
  return <>
    <div className="whitespace-nowrap bg-primary px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-normal text-primary-foreground min-[380px]:text-[10px] min-[380px]:tracking-wide md:px-4 md:text-xs md:tracking-widest">Professionally cleaned · Nationwide · One pair only</div>
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <MobileNavDrawer user={user} isAdmin={isAdmin} />
        <Logo size="h-16"/>
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex"><Link href="/shop">New drops</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Court">Court</Link><Link href="/shop?category=Trail">Trail</Link><HelpMenu/></nav>
        <div className="flex items-center gap-4"><SearchBar/><AccountMenu user={user} isAdmin={isAdmin}/><button className="relative" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={21}/><span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{cartCount}</span></button></div>
      </div>
    </header>
  </>
}
