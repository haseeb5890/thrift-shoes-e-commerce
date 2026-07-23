"use client"

import { useState } from "react"
import * as Accordion from "@radix-ui/react-accordion"
import * as Slider from "@radix-ui/react-slider"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import { useRouter, usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { useShopPending } from "@/components/shop-pending-provider"
import type { FacetCounts } from "@/lib/products"

const triggerClass = "group flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider"
const indicator = (
  <span className="text-lg font-normal leading-none">
    <Plus size={14} className="group-data-[state=open]:hidden" />
    <Minus size={14} className="hidden group-data-[state=open]:block" />
  </span>
)
const contentAnimClass = "overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1"

function PriceRangeFilter({
  bounds,
  router,
  pathname,
  searchParams,
  startShopTransition,
}: {
  bounds: { min: number; max: number }
  router: ReturnType<typeof useRouter>
  pathname: string
  searchParams: ReadonlyURLSearchParams
  startShopTransition: ReturnType<typeof useShopPending>["startShopTransition"]
}) {
  const paramMin = searchParams.get("minPrice")
  const paramMax = searchParams.get("maxPrice")
  const [range, setRange] = useState<[number, number]>([
    paramMin ? Number(paramMin) : bounds.min,
    paramMax ? Number(paramMax) : bounds.max,
  ])

  function commit(next: [number, number]) {
    const params = new URLSearchParams(searchParams.toString())
    if (next[0] > bounds.min) params.set("minPrice", String(next[0])); else params.delete("minPrice")
    if (next[1] < bounds.max) params.set("maxPrice", String(next[1])); else params.delete("maxPrice")
    params.delete("page")
    startShopTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  if (bounds.min >= bounds.max) return null

  return (
    <div className="mt-3">
      <Slider.Root
        min={bounds.min}
        max={bounds.max}
        step={100}
        value={range}
        onValueChange={(v) => setRange(v as [number, number])}
        onValueCommit={(v) => commit(v as [number, number])}
        className="relative flex h-4 w-full touch-none items-center"
      >
        <Slider.Track className="relative h-0.5 w-full grow bg-border">
          <Slider.Range className="absolute h-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb className="block size-4 rounded-full border-2 border-primary bg-background outline-none" aria-label="Minimum price" />
        <Slider.Thumb className="block size-4 rounded-full border-2 border-primary bg-background outline-none" aria-label="Maximum price" />
      </Slider.Root>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <div className="flex flex-1 items-center gap-1 border border-border px-2 py-1.5">
          <span className="text-muted-foreground">Rs</span>
          <input
            type="number"
            value={range[0]}
            min={bounds.min}
            max={range[1]}
            onChange={(e) => setRange([Number(e.target.value), range[1]])}
            onBlur={() => commit(range)}
            className="w-full bg-transparent outline-none"
          />
        </div>
        <span className="text-muted-foreground">to</span>
        <div className="flex flex-1 items-center gap-1 border border-border px-2 py-1.5">
          <span className="text-muted-foreground">Rs</span>
          <input
            type="number"
            value={range[1]}
            min={range[0]}
            max={bounds.max}
            onChange={(e) => setRange([range[0], Number(e.target.value)])}
            onBlur={() => commit(range)}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export function FilterAccordionSections({ facets }: { facets: FacetCounts }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startShopTransition } = useShopPending()

  const activeSizes = searchParams.get("size")?.split(",").filter(Boolean) ?? []
  const activeBrands = searchParams.get("brand")?.split(",").filter(Boolean) ?? []
  const activeConditions = searchParams.get("condition")?.split(",").filter(Boolean) ?? []
  const activeGender = searchParams.get("gender") ?? ""

  function toggleValue(key: "size" | "brand" | "condition", value: string) {
    const current = key === "size" ? activeSizes : key === "brand" ? activeBrands : activeConditions
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]

    const params = new URLSearchParams(searchParams.toString())
    if (next.length) params.set(key, next.join(","))
    else params.delete(key)
    params.delete("page")
    startShopTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function toggleGender(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (activeGender === value) params.delete("gender")
    else params.set("gender", value)
    params.delete("page")
    startShopTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const availableSizes = facets.sizes.filter((size) => size.count > 0 || activeSizes.includes(size.value))
  const availableGenders = facets.genders.filter((gender) => gender.count > 0 || activeGender === gender.value)

  return (
    <Accordion.Root type="multiple" defaultValue={["price", "size", "gender", "condition", "brand"]} className="flex flex-col divide-y divide-border">

      <Accordion.Item value="size" className="py-4">
        <Accordion.Trigger className={triggerClass}>
          Size
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className={`mt-3 grid grid-cols-4 gap-1.5 ${contentAnimClass}`}>
          {availableSizes.map((size) => {
            const isActive = activeSizes.includes(size.value)
            return (
              <button
                key={size.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleValue("size", size.value)}
                className={`flex h-8 items-center justify-center border rounded-lg text-[11px] font-bold transition-colors ${
                  isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/50"
                }`}
              >
                {size.value}
              </button>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="gender" className="py-4">
        <Accordion.Trigger className={triggerClass}>
          Fit
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className={`mt-3 flex flex-wrap gap-1.5 ${contentAnimClass}`}>
          {availableGenders.map((gender) => {
            const isActive = activeGender === gender.value
            return (
              <button
                key={gender.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleGender(gender.value)}
                className={`flex h-8 items-center justify-center border rounded-lg px-3 text-[11px] font-bold transition-colors ${
                  isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/50"
                }`}
              >
                {gender.value}
              </button>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="condition" className="py-4">
        <div className="flex items-center justify-between">
          <Accordion.Trigger className={triggerClass}>
            Condition
            {indicator}
          </Accordion.Trigger>
        </div>
        <Accordion.Content className={`mt-3 flex flex-col gap-2 ${contentAnimClass}`}>
          <Link href="/condition-guide" className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary underline underline-offset-2">
            What do these mean?
          </Link>
          {facets.conditions.map((condition) => {
            const isActive = activeConditions.includes(condition.value)
            const isDisabled = condition.count === 0 && !isActive
            return (
              <label key={condition.value} className={`flex items-center gap-2 text-xs ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isDisabled}
                  onChange={() => toggleValue("condition", condition.value)}
                  className="size-3.5 accent-primary"
                />
                <span className="font-semibold">
                  {condition.value} <span className="font-normal text-muted-foreground">({condition.count})</span>
                </span>
              </label>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="brand" className="py-4 last:pb-0">
        <Accordion.Trigger className={triggerClass}>
          Brand
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className={`mt-3 flex flex-col gap-2 ${contentAnimClass}`}>
          {facets.brands.map((brand) => {
            const isActive = activeBrands.includes(brand.value)
            const isDisabled = brand.count === 0 && !isActive
            return (
              <label key={brand.value} className={`flex items-center gap-2 text-xs ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isDisabled}
                  onChange={() => toggleValue("brand", brand.value)}
                  className="size-3.5 accent-primary"
                />
                <span className="font-semibold">
                  {brand.value} <span className="font-normal text-muted-foreground">({brand.count})</span>
                </span>
              </label>
            )
          })}
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="price" className="py-4 first:pt-0">
        <Accordion.Trigger className={triggerClass}>
          Price
          {indicator}
        </Accordion.Trigger>
        <Accordion.Content className={contentAnimClass}>
          <PriceRangeFilter bounds={facets.priceBounds} router={router} pathname={pathname} searchParams={searchParams} startShopTransition={startShopTransition} />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
