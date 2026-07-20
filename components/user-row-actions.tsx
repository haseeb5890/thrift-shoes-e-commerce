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
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
        router.refresh()
        setConfirmingDelete(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed")
      }
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
      <div className="animate-in fade-in-0 slide-in-from-right-1 flex flex-wrap items-center justify-end gap-2 text-xs font-bold uppercase tracking-wider duration-150">
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

  if (confirmingDelete) {
    return (
      <div className="animate-in fade-in-0 slide-in-from-right-1 flex flex-wrap items-center justify-end gap-2 text-xs font-bold uppercase tracking-wider duration-150">
        <span className="normal-case tracking-normal text-muted-foreground">Delete {user.email}?</span>
        <button disabled={pending} onClick={() => run(() => deleteUserAccount(user.id))} className="text-destructive underline disabled:opacity-50">
          {pending ? "Deleting..." : "Confirm"}
        </button>
        <button disabled={pending} onClick={() => setConfirmingDelete(false)} className="text-muted-foreground underline disabled:opacity-50">Never mind</button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase tracking-wider">
      <button disabled={pending} onClick={() => setAwaitingPin(true)} className="underline disabled:opacity-50">{user.role === "admin" ? "Demote" : "Promote"}</button>
      <button disabled={pending} onClick={() => run(() => toggleUserBan(user.id, !user.banned))} className="underline disabled:opacity-50">{user.banned ? "Unban" : "Ban"}</button>
      <button disabled={pending} onClick={() => setConfirmingDelete(true)} className="text-destructive underline disabled:opacity-50">Delete</button>
    </div>
  )
}
