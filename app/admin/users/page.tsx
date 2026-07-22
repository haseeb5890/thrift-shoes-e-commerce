import { listUsers } from "@/app/actions/users"
import { UserRowActions } from "@/components/user-row-actions"
import { ExportCsvButton } from "@/components/export-csv-button"

export default async function AdminUsersPage() {
  const users = await listUsers()
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-black md:text-5xl">Users.</h1>
        <ExportCsvButton target={{ type: "users" }} filename={`users-${new Date().toISOString().slice(0, 10)}.csv`} />
      </div>
      <div className="mt-8 overflow-x-auto bg-background p-5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="px-3 py-4 font-bold">{user.name}</td>
                <td className="px-3 py-4">{user.email}</td>
                <td className="px-3 py-4 capitalize">{user.role}</td>
                <td className="px-3 py-4">
                  {user.banned ? <span className="font-bold text-destructive">Banned</span> : <span className="text-accent">Active</span>}
                </td>
                <td className="px-3 py-4">
                  <UserRowActions user={user} locked={user.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
