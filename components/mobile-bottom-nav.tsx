"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, LayoutGrid, UserRound, ShoppingBag } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { useSearchPanel } from "@/components/search-provider"
import type { AccountMenuUser } from "@/components/account-menu"

export function MobileBottomNav({ user }: { user: AccountMenuUser | null }) {
  const pathname = usePathname()
  const { cartCount, setCartOpen } = useStore()
  const { setSearchOpen } = useSearchPanel()

  const linkItems = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
  ]
  const trailingLinkItems = [
    { label: "Collection", href: "/shop", icon: LayoutGrid, active: pathname?.startsWith("/shop") },
    { label: "Account", href: user ? "/account" : "/sign-in", icon: UserRound, active: pathname?.startsWith("/account") || pathname?.startsWith("/sign-in") },
  ]

  const itemClass = (active?: boolean) => `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground"}`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center border-t border-border bg-background md:hidden">
      {linkItems.map((item) => (
        <Link key={item.label} href={item.href} className={itemClass(item.active)}>
          <item.icon size={19} strokeWidth={item.active ? 2.5 : 2} />
          {item.label}
        </Link>
      ))}

      <button type="button" onClick={() => setSearchOpen(true)} aria-label="Open search" className={itemClass(false)}>
        <Search size={19} />
        Search
      </button>

      {trailingLinkItems.map((item) => (
        <Link key={item.label} href={item.href} className={itemClass(item.active)}>
          <item.icon size={19} strokeWidth={item.active ? 2.5 : 2} />
          {item.label}
        </Link>
      ))}

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`Open cart with ${cartCount} items`}
        className={itemClass(false)}
      >
        <span className="relative">
          <ShoppingBag size={19} />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {cartCount}
            </span>
          )}
        </span>
        Cart
      </button>
    </nav>
  )
}
