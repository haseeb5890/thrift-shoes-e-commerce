"use client"

import Image from "next/image"
import * as Dialog from "@radix-ui/react-dialog"
import { Ruler, X } from "lucide-react"

export function SizeChartDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5 border-b border-dotted border-foreground text-xs font-bold text-lime-900 uppercase tracking-wider">
          <Ruler size={13} /> Size chart
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-background p-4 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size chart</Dialog.Title>
            <Dialog.Close aria-label="Close size chart"><X size={18} /></Dialog.Close>
          </div>
          <div className="relative mt-3 aspect-square w-full">
            <Image src="/images/size-chart.png" alt="Prime Soles size chart — Men's and Women's EU, UK/PK, and US sizing" fill className="object-contain" sizes="(max-width: 768px) 100vw, 448px" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
