import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, BrushCleaning, PackageCheck, Truck } from "lucide-react"
import { formatPKR, type Product } from "@/lib/store-data"
import { ProductCard } from "@/components/product-card"

export function HomePage({ products }: { products: Product[] }) {
  const lowestPrice = products.length ? Math.min(...products.map((product) => product.price)) : null

  return <>
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-4">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr_1fr]">
          <div className="text-center md:text-left">
            <h1 className="text-balance font-serif text-5xl font-black leading-[1.05] tracking-tight md:text-6xl">The <span className="text-primary">ReLace</span> edit of hand-graded pre-owned sneakers.</h1>
          </div>
          <div className="relative mx-auto flex w-full max-w-xl items-center justify-center">
            <div className="absolute left-1/2 top-1/2 aspect-square h-full -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_58%_42%/56%_44%_56%_44%] bg-primary"/>
            <Image src="/images/hero-shoe.png" alt="Featured thrifted sneaker" width={2400} height={3000} priority className="relative z-10 h-[150%] w-full drop-shadow-2xl overflow-hidden"/>
          </div>
          <div className="text-center md:text-left">
            <p className="mx-auto max-w-sm text-pretty text-base leading-7 text-muted-foreground md:mx-0">One-of-one pre-owned sneakers, professionally cleaned and honestly graded. Find your next favorite pair without paying retail.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 md:justify-start">
              <Link href="/shop" className="flex h-12 items-center gap-3 bg-primary px-7 font-bold text-primary-foreground">Explore shoes <ArrowRight size={18}/></Link>
              <Link href="/about" className="text-sm font-bold underline underline-offset-4">How we grade</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="border-y border-border"><div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">{[[BadgeCheck,"Honest grading"],[BrushCleaning,"Deep cleaned"],[PackageCheck,"One pair only"],[Truck,"Pakistan wide"]].map(([Icon,label],i)=><div key={label as string} className={`flex items-center gap-3 border-border px-4 py-5 text-sm font-bold ${i < 3 ? "md:border-r" : ""}`}><Icon size={20} className="text-primary"/>{label as string}</div>)}</div></section>
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Freshly added</p><h2 className="mt-2 text-balance font-serif text-4xl font-black md:text-5xl">The latest rotation</h2></div><Link href="/shop" className="hidden items-center gap-2 text-sm font-bold md:flex">View all <ArrowRight size={16}/></Link></div><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">{products.slice(0,4).map((product)=><ProductCard key={product.id} product={product}/>)}</div></section>
    <section className="bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24"><div><p className="text-xs font-bold uppercase tracking-[0.2em]">The ReLace standard</p><h2 className="mt-4 text-balance font-serif text-5xl font-black leading-none">No mystery pairs. Every mark disclosed.</h2></div><div className="grid gap-7 sm:grid-cols-2"><div><span className="font-serif text-4xl font-black">01</span><h3 className="mt-3 font-bold">Inspect</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/75">We check soles, stitching, lining, shape and authenticity before listing.</p></div><div><span className="font-serif text-4xl font-black">02</span><h3 className="mt-3 font-bold">Restore</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/75">Every pair is deep-cleaned, deodorized and photographed as it is.</p></div></div></div></section>
  </>
}
