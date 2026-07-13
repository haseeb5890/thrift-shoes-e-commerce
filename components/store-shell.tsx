import { StoreProvider } from "@/components/store-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawer } from "@/components/cart-drawer"

export function StoreShell({ children }: { children: React.ReactNode }) {
  return <StoreProvider><SiteHeader/><main>{children}</main><SiteFooter/><CartDrawer/></StoreProvider>
}
