"use client"

import Image from "next/image"
import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"
import { Trash2, X } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { formatPKR } from "@/lib/store-data"

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart } = useStore()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Dialog.Root open={cartOpen} onOpenChange={setCartOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-[80vw] max-w-md flex-col bg-background p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Your rotation</p>
              <Dialog.Title className="font-serif text-3xl font-black">Shopping bag</Dialog.Title>
            </div>
            <Dialog.Close aria-label="Close cart">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-5">
            {cart.length === 0 ? (
              <div className="m-auto text-center">
                <p className="font-serif text-2xl font-bold">Your bag is empty</p>
                <Dialog.Close asChild>
                  <button className="mt-4 text-sm font-bold underline">Keep browsing</button>
                </Dialog.Close>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <Dialog.Close asChild>
                    <Link href={`/shop/${item.slug}`} className="flex flex-1 gap-4">
                      <div className="relative size-24 shrink-0 bg-secondary">
                        <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="text-xs uppercase text-muted-foreground">{item.brand} · {item.size}</p>
                        <p className="font-serif text-lg font-bold">{item.name}</p>
                        <p className="mt-auto text-sm font-bold">{formatPKR(item.price)}</p>
                      </div>
                    </Link>
                  </Dialog.Close>
                  <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from bag`} className="self-start text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-border pt-5">
              <div className="mb-4 flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">Shipping is calculated from your city at checkout.</p>
              <Dialog.Close asChild>
                <Link href="/checkout" className="flex h-12 items-center justify-center bg-primary font-bold text-primary-foreground">
                  Checkout securely
                </Link>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
