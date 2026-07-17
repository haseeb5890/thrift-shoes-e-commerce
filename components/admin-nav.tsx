"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        // "/admin" should only be active on the exact dashboard route, not on every /admin/* subroute.
        const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 px-3 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              isActive ? "border-b-2 border-primary text-background" : "border-b-2 border-transparent text-background/60 hover:text-background"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}