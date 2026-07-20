"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const HELP_LINKS = [
  { label: "Condition guide", href: "/condition-guide" },
  { label: "Size guide", href: "/size-guide" },
  { label: "Track order", href: "/track" },
  { label: "Contact", href: "/contact" },
]

export function HelpMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5" aria-label="Help menu" aria-expanded={open}>
        Help
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 origin-top border border-border bg-background py-2 shadow-xl duration-150">
          {HELP_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm font-semibold hover:bg-secondary">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
