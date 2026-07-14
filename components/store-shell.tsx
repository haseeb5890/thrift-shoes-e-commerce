import { StoreProvider } from "@/components/store-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawer } from "@/components/cart-drawer"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/auth-helpers"

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headerUser = user ? { name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Account", email: user.email ?? "" } : null
  return <StoreProvider><SiteHeader user={headerUser} isAdmin={isAdminUser(user)}/><main>{children}</main><SiteFooter/><CartDrawer/></StoreProvider>
}
