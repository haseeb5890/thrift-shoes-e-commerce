import Link from "next/link"
import { requireAdminPage } from "@/lib/auth-helpers"
import { listUsers } from "@/app/actions/users"
import { UserRowActions } from "@/components/user-row-actions"

export default async function AdminUsersPage() {
  await requireAdminPage()
  const users = await listUsers()
  return <main className="min-h-svh bg-secondary"><header className="border-b border-border bg-foreground text-background"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6"><Link href="/admin" className="font-serif text-2xl font-black">ReLace.</Link><div className="text-xs font-bold uppercase tracking-widest">Manage users</div></div></header><section className="mx-auto max-w-5xl px-4 py-10 md:px-6"><h1 className="font-serif text-5xl font-black">Users.</h1><div className="mt-8 overflow-x-auto bg-background p-5"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3">Name</th><th>Email</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{users.map((user)=><tr key={user.id} className="border-b border-border"><td className="py-4 font-bold">{user.name}</td><td>{user.email}</td><td className="capitalize">{user.role}</td><td>{user.banned?<span className="font-bold text-destructive">Banned</span>:<span className="text-accent">Active</span>}</td><td><UserRowActions user={user} locked={user.email.toLowerCase()===process.env.ADMIN_EMAIL?.toLowerCase()}/></td></tr>)}</tbody></table></div></section></main>
}
