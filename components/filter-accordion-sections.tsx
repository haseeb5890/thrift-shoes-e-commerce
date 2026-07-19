"use client"

import * as Accordion from "@radix-ui/react-accordion"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { FacetCounts } from "@/lib/products"

const triggerClass = "group flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-widest"
const indicator = (
  <span className="text-lg font-normal leading-none">
    <Plus size={14} className="group-data-[state=open]:hidden" />
    <Minus size={14} className="hidden group-data-[state=open]:block" />
  </span>
)

export function FilterAccordionSections({ facets }: { facets: FacetCounts }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeSizes = searchParams.get("size")?.split(",").filter(Boolean) ?? []
  const activeBrands = searchParams.get("brand")?.split(",").filter(Boolean) ?? []
  const activeConditions = searchParams.get("condition")?.split(",").filter(Boolean) ?? []

  function toggleValue(key: "size" | "brand" | "condition", value: string) {
    const current = key === "size" ? activeSizes : key === "brand" ? activeBrands : activeConditions
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]

    const params = new URLSearchParams(searchParams.toString())
    if (next.length) params.set(key, next.join(","))
    else params.delete(key)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Accordion.Root type="multiple" defaultValue={["size", "condition", "brand"]} className="flex flex-col divide-y divide-border">
      <Accordion.Item value="size" className="py-5 first:pt-0">
        <Accordion.Trigger className={triggerClass}>
          Size
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className="mt-4 grid grid-cols-4 gap-2">
          {facets.sizes.map((size) => {
            const isActive = activeSizes.includes(size.value)
            const isDisabled = size.count === 0 && !isActive
            return (
              <button
                key={size.value}
                type="button"
                disabled={isDisabled}
                aria-pressed={isActive}
                onClick={() => toggleValue("size", size.value)}
                className={`flex h-11 items-center justify-center border bg-card text-xs font-bold transition-colors ${
                  isActive
                    ? "border-2 border-foreground"
                    : isDisabled
                      ? "cursor-not-allowed border-border bg-secondary text-muted-foreground/40"
                      : "border-border hover:border-foreground/50"
                }`}
              >
                {size.value}
              </button>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="condition" className="py-5">
        <div className="flex items-center justify-between">
          <Accordion.Trigger className={triggerClass}>
            Condition
            {indicator}
          </Accordion.Trigger>
        </div>
        <Accordion.Content className="mt-4 flex flex-col gap-3">
          <Link href="/condition-guide" className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary underline underline-offset-2">
            What do these mean?
          </Link>
          {facets.conditions.map((condition) => {
            const isActive = activeConditions.includes(condition.value)
            const isDisabled = condition.count === 0 && !isActive
            return (
              <label key={condition.value} className={`flex items-center gap-3 text-sm ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isDisabled}
                  onChange={() => toggleValue("condition", condition.value)}
                  className="size-4 accent-foreground"
                />
                <span className="font-semibold">
                  {condition.value} <span className="font-normal text-muted-foreground">({condition.count})</span>
                </span>
              </label>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="brand" className="py-5 last:pb-0">
        <Accordion.Trigger className={triggerClass}>
          Brand
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className="mt-4 flex flex-col gap-3">
          {facets.brands.map((brand) => {
            const isActive = activeBrands.includes(brand.value)
            const isDisabled = brand.count === 0 && !isActive
            return (
              <label key={brand.value} className={`flex items-center gap-3 text-sm ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isDisabled}
                  onChange={() => toggleValue("brand", brand.value)}
                  className="size-4 accent-foreground"
                />
                <span className="font-semibold">
                  {brand.value} <span className="font-normal text-muted-foreground">({brand.count})</span>
                </span>
              </label>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}