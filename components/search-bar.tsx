"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    router.push(`/shop?q=${encodeURIComponent(value.trim())}`)
    setOpen(false)
  }

  if (!open) return <button onClick={() => setOpen(true)} aria-label="Search products by name or size"><Search size={20} /></button>

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search by name or size" className="h-9 w-40 border border-input bg-card px-2 text-sm outline-none focus:border-primary sm:w-56" />
      <button type="button" onClick={() => setOpen(false)} aria-label="Close search"><X size={18} /></button>
    </form>
  )
}
