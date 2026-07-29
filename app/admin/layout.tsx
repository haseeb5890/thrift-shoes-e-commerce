import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAdminPage } from "@/lib/auth-helpers"
import { AdminNav } from "@/components/admin-nav"
import { Logo } from "@/components/logo"
import { AdminProductUploadProvider } from "@/components/admin-product-upload-provider"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage()

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Logo href="/" variant="secondary" size="h-10" wrapperClassName="shrink-0"/>
          <div className="hidden truncate text-xs font-bold uppercase tracking-widest text-background/80 md:block">
            Store admin · {user.user_metadata?.name ?? user.email}
          </div>
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 border border-background/30 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:border-background hover:bg-background hover:text-foreground"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to store</span>
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <AdminNav />
        </div>
      </header>
      <AdminProductUploadProvider>{children}</AdminProductUploadProvider>
    </div>
  )
}