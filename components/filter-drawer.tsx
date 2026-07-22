"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { FilterAccordionSections } from "@/components/filter-accordion-sections"
import type { FacetCounts } from "@/lib/products"

export function FilterDrawer({ open, onOpenChange, facets }: { open: boolean; onOpenChange: (open: boolean) => void; facets: FacetCounts }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters = ["size", "brand", "condition"].some((key) => searchParams.get(key))

  function clearAll() {
    router.push(pathname)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out md:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[80vw] max-w-sm flex-col bg-background shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right md:hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <Dialog.Title className="font-serif text-xl font-black">Filters</Dialog.Title>
            <Dialog.Close aria-label="Close filters">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <FilterAccordionSections facets={facets} />
          </div>

          <div className="flex items-center gap-3 border-t border-border p-4">
            {hasActiveFilters && (
              <button type="button" onClick={clearAll} className="h-12 flex-1 border border-foreground text-xs font-bold uppercase tracking-widest">
                Clear all
              </button>
            )}
            <Dialog.Close asChild>
              <button type="button" className="h-12 flex-1 bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground">
                Show results
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}