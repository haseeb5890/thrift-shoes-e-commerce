"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, X } from "lucide-react"
import { useSearchPanel } from "@/components/search-provider"
import { searchProductsPreview, getPopularProducts } from "@/app/actions/shop-products"
import { formatPKR, type Product } from "@/lib/store-data"

const TRENDING = [
  { label: "men", type: "gender" as const, value: "Men" },
  { label: "women", type: "gender" as const, value: "Women" },
  { label: "kids", type: "gender" as const, value: "Kids" },
  { label: "adidas", type: "brand" as const, value: "Adidas" },
  { label: "nike", type: "brand" as const, value: "Nike" },
  { label: "converse", type: "brand" as const, value: "Converse" },
  { label: "reebok", type: "brand" as const, value: "Reebok" },
  { label: "fila", type: "brand" as const, value: "Fila" },
]

function ProductTile({ product, onNavigate }: { product: Product; onNavigate: () => void }) {
  return (
    <Link href={`/shop/${product.slug}`} onClick={onNavigate} className="flex flex-col gap-2">
      <div className="relative aspect-square bg-secondary">
        <Image src={product.imageUrl} alt={product.imageAlt} fill className="object-cover" sizes="200px" />
      </div>
      <div>
        <p className="text-sm font-bold">{product.name}</p>
        <p className="text-sm font-bold text-primary">{formatPKR(product.price)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Size: {product.size}</p>
        <p className="text-xs text-muted-foreground">Condition: {product.condition}</p>
      </div>
    </Link>
  )
}

export function SearchPanel() {
  const router = useRouter()
  const { searchOpen, setSearchOpen } = useSearchPanel()
  const [value, setValue] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [popular, setPopular] = useState<Product[]>([])
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchOpen && popular.length === 0) {
      getPopularProducts(4).then(setPopular)
    }
  }, [searchOpen, popular.length])

  useEffect(() => {
    if (!value.trim()) {
      setResults([])
      setTotal(0)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchProductsPreview(value, 6)
        setResults(result.products)
        setTotal(result.total)
      })
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  function close() {
    setSearchOpen(false)
    setValue("")
    setResults([])
  }

  function goToAllResults() {
    if (!value.trim()) return
    router.push(`/shop?q=${encodeURIComponent(value.trim())}`)
    close()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    goToAllResults()
  }

  function onTrendingClick(chip: (typeof TRENDING)[number]) {
    if (chip.type === "gender") {
      router.push(`/shop?gender=${encodeURIComponent(chip.value)}`)
      close()
    } else {
      setValue(chip.label)
    }
  }

  return (
    <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-[80vw] max-w-sm flex-col bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <div className="flex items-center justify-between border-b border-border p-5">
            <Dialog.Title className="text-lg font-bold">Search</Dialog.Title>
            <Dialog.Close aria-label="Close search" onClick={close}>
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search products..."
                className="h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-primary"
              />
              <button type="submit" aria-label="Search" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                <Search size={18} />
              </button>
            </form>

            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Trending now</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRENDING.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onTrendingClick(chip)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <Search size={11} />
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {value.trim() ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {isPending && results.length === 0 ? "Searching..." : `Results${total ? ` (${total})` : ""}`}
                  </p>
                  {!isPending && results.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No pairs match "{value.trim()}".</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
                      {results.map((product) => (
                        <ProductTile key={product.id} product={product} onNavigate={close} />
                      ))}
                    </div>
                  )}
                  {total > results.length && (
                    <button
                      type="button"
                      onClick={goToAllResults}
                      className="mt-6 block w-full border border-border py-3 text-center text-xs font-bold uppercase tracking-wider hover:border-foreground"
                    >
                      View all results ({total})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Popular products</p>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
                    {popular.map((product) => (
                      <ProductTile key={product.id} product={product} onNavigate={close} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
