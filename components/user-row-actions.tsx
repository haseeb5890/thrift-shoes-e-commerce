"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteUserAccount, setUserRole, toggleUserBan } from "@/app/actions/users"

type Row = { id: string; email: string; role: "admin" | "user"; banned: boolean }

export function UserRowActions({ user, locked }: { user: Row; locked: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try { await action(); router.refresh() } catch (error) { alert(error instanceof Error ? error.message : "Action failed") }
    })
  }

  if (locked) return <span className="text-xs text-muted-foreground">Bootstrap admin</span>

  return (
    <div className="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase tracking-wider">
      <button disabled={pending} onClick={() => run(() => setUserRole(user.id, user.role === "admin" ? "user" : "admin"))} className="underline">{user.role === "admin" ? "Demote" : "Promote"}</button>
      <button disabled={pending} onClick={() => run(() => toggleUserBan(user.id, !user.banned))} className="underline">{user.banned ? "Unban" : "Ban"}</button>
      <button disabled={pending} onClick={() => { if (confirm(`Delete ${user.email}? This can't be undone.`)) run(() => deleteUserAccount(user.id)) }} className="text-destructive underline">Delete</button>
    </div>
  )
}
