"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import * as Accordion from "@radix-ui/react-accordion"
import { Menu, Minus, Package, Plus, Truck, UserRound, UserRoundPlus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AccountMenuUser } from "@/components/account-menu"

const NAV_LINKS = [
  { label: "New drops", href: "/shop" },
  { label: "Running", href: "/shop?category=Running" },
  { label: "Court", href: "/shop?category=Court" },
  { label: "Trail", href: "/shop?category=Trail" },
]

const HELP_LINKS = [
  { label: "Condition guide", href: "/condition-guide" },
  { label: "Size guide", href: "/size-guide" },
  { label: "Track order", href: "/track" },
  { label: "Return policy", href: "/return-policy" },
  { label: "Contact", href: "/contact" },
]

const rowClass = "flex items-center gap-3 border-b border-border px-5 py-4 text-base font-bold"
const accountRowClass = "flex items-center gap-3 border-b border-border px-5 py-4 text-sm font-semibold last:border-b-0"
const accordionContentAnim = "overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1"

export function MobileNavDrawer({ user, isAdmin }: { user: AccountMenuUser | null; isAdmin: boolean }) {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="md:hidden" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out md:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[90vw] max-w-sm flex-col bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left md:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Menu</Dialog.Title>
            <Dialog.Close aria-label="Close menu">
              <X size={20} />
            </Dialog.Close>
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto">
            {NAV_LINKS.map((link) => (
              <Dialog.Close asChild key={link.href}>
                <Link href={link.href} className={rowClass}>{link.label}</Link>
              </Dialog.Close>
            ))}

            <Accordion.Root type="single" collapsible className="border-b border-border">
              <Accordion.Item value="help">
                <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between px-5 py-4 text-base font-bold">
                  Help
                  <span>
                    <Plus size={16} className="group-data-[state=open]:hidden" />
                    <Minus size={16} className="hidden group-data-[state=open]:block" />
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className={accordionContentAnim}>
                  {HELP_LINKS.map((link) => (
                    <Dialog.Close asChild key={link.href}>
                      <Link href={link.href} className={accountRowClass}>{link.label}</Link>
                    </Dialog.Close>
                  ))}
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>

            <Accordion.Root type="single" collapsible defaultValue="account" className="mt-4 flex-1 bg-secondary/50">
              <Accordion.Item value="account">
                <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {user ? (
                    <span className="flex items-center gap-2 text-sm font-bold normal-case tracking-normal text-foreground">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
                      <span className="max-w-40 truncate">{user.name}</span>
                    </span>
                  ) : (
                    "Account"
                  )}
                  <span>
                    <Plus size={14} className="group-data-[state=open]:hidden" />
                    <Minus size={14} className="hidden group-data-[state=open]:block" />
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className={accordionContentAnim}>
                  {user ? (
                    <>
                      <Dialog.Close asChild>
                        <Link href="/account" className={accountRowClass}><UserRound size={18} /> My account</Link>
                      </Dialog.Close>
                      {!isAdmin && (
                        <>
                        <Dialog.Close asChild>
                          <Link href="/account" className={accountRowClass}><Package size={18} /> My orders</Link>
                        </Dialog.Close>
                      
                      <Dialog.Close asChild>
                        <Link href="/track" className={accountRowClass}><Truck size={18} /> Track order</Link>
                      </Dialog.Close>
                       
                      <Dialog.Close asChild>
                        <Link href="/wishlist" className={accountRowClass}>Wishlist</Link>
                      </Dialog.Close>
                       </>
                      )}
                      {isAdmin && (
                        <>
                          <Dialog.Close asChild>
                            <Link href="/admin/products" className={accountRowClass}>Manage products</Link>
                          </Dialog.Close>
                          <Dialog.Close asChild>
                            <Link href="/admin/orders" className={accountRowClass}>Manage orders</Link>
                          </Dialog.Close>
                          <Dialog.Close asChild>
                            <Link href="/admin/users" className={accountRowClass}>Manage users</Link>
                          </Dialog.Close>
                        </>
                      )}
                      <button onClick={logout} className={`${accountRowClass} text-left text-destructive`}>Logout</button>
                    </>
                  ) : (
                    <>
                      <Dialog.Close asChild>
                        <Link href="/sign-in" className={accountRowClass}><UserRound size={18} /> Sign In</Link>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <Link href="/sign-up" className={accountRowClass}><UserRoundPlus size={18} /> Create an Account</Link>
                      </Dialog.Close>
                    </>
                  )}
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
