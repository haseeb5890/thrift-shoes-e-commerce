"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteUserAccount, setUserRole, toggleUserBan } from "@/app/actions/users"

type Row = { id: string; email: string; role: "admin" | "user"; banned: boolean }

export function UserRowActions({ user, locked }: { user: Row; locked: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [awaitingPin, setAwaitingPin] = useState(false)
  const [pin, setPin] = useState("")

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try { await action(); router.refresh() } catch (error) { alert(error instanceof Error ? error.message : "Action failed") }
    })
  }

  function confirmRoleChange() {
    startTransition(async () => {
      const result = await setUserRole(user.id, user.role === "admin" ? "user" : "admin", pin)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setAwaitingPin(false)
      setPin("")
      router.refresh()
    })
  }

  if (locked) return <span className="text-xs text-muted-foreground">Bootstrap admin</span>

  if (awaitingPin) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold uppercase tracking-wider">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          inputMode="numeric"
          maxLength={4}
          disabled={pending}
          className="h-7 w-14 border border-border bg-card px-2 normal-case tracking-normal"
        />
        <button disabled={pending} onClick={confirmRoleChange} className="underline disabled:opacity-50">Confirm</button>
        <button disabled={pending} onClick={() => { setAwaitingPin(false); setPin("") }} className="text-muted-foreground underline disabled:opacity-50">Never mind</button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase tracking-wider">
      <button disabled={pending} onClick={() => setAwaitingPin(true)} className="underline">{user.role === "admin" ? "Demote" : "Promote"}</button>
      <button disabled={pending} onClick={() => run(() => toggleUserBan(user.id, !user.banned))} className="underline">{user.banned ? "Unban" : "Ban"}</button>
      <button disabled={pending} onClick={() => { if (confirm(`Delete ${user.email}? This can't be undone.`)) run(() => deleteUserAccount(user.id)) }} className="text-destructive underline">Delete</button>
    </div>
  )
}
