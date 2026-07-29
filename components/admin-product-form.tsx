"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createProduct, updateProduct } from "@/app/actions/products"
import { useAdminProductUpload } from "@/components/admin-product-upload-provider"
import { ProductMediaPicker } from "@/components/product-media-picker"
import { TYPES, GENDERS, CONDITIONS } from "@/lib/product-options"

type ExistingProduct = {
  id: string
  name: string
  brand: string
  category: string[]
  gender: string
  size: string
  color: string
  condition: string
  price: number
  compareAtPrice: number | null
  stock: number
  description: string | null
  isFeatured: boolean
}

type ExistingMedia = { id: string; url: string; kind: string }

type Props = { mode: "create" } | { mode: "edit"; product: ExistingProduct; media: ExistingMedia[] }

const fieldClass = "h-12 border border-input bg-card px-3"

// Submits via onSubmit (not a native form action) specifically so we can navigate to
// /admin/products immediately and let createProduct/updateProduct finish in the background —
// a native `<form action={serverAction}>` can't do that, since the browser only navigates once
// the action itself resolves (which is what redirect() inside it used to rely on).
export function AdminProductForm(props: Props) {
  const router = useRouter()
  const { start, finish } = useAdminProductUpload()
  const [, startTransition] = useTransition()
  const isEdit = props.mode === "edit"
  const product = isEdit ? props.product : null
  const images = isEdit ? props.media.filter((item) => item.kind === "image") : []
  const video = isEdit ? props.media.find((item) => item.kind === "video") : undefined

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const label = String(formData.get("name") || product?.name || "product")

    start(label)
    router.push("/admin/products")

    startTransition(async () => {
      const result = isEdit ? await updateProduct(formData) : await createProduct(formData)
      finish()
      if ("error" in result) toast.error(result.error)
      else toast.success(isEdit ? "Product updated" : "Product created")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 bg-background p-6">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <input name="name" placeholder="Name" defaultValue={product?.name} required className={fieldClass} />
        <input name="brand" placeholder="Brand" defaultValue={product?.brand} required className={fieldClass} />
        <select name="gender" required defaultValue={product?.gender ?? ""} className={fieldClass}>
          {!isEdit && <option value="" disabled>Gender</option>}
          {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
        </select>
        <input name="size" placeholder="Size (e.g. EU 42)" defaultValue={product?.size} required className={fieldClass} />
        <input name="color" placeholder="Color" defaultValue={product?.color} required className={fieldClass} />
        <select name="condition" required defaultValue={product?.condition ?? ""} className={fieldClass}>
          {!isEdit && <option value="" disabled>Condition</option>}
          {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
        </select>
        <input name="price" type="number" min={1} placeholder="Price (PKR)" defaultValue={product?.price} required className={fieldClass} />
        <input name="compareAtPrice" type="number" min={1} placeholder="Compare-at price (optional)" defaultValue={product?.compareAtPrice ?? undefined} className={fieldClass} />
        <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} placeholder="Stock" required className={fieldClass} />
      </div>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type (select all that apply)</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 border border-input bg-card px-3 py-2 text-sm font-semibold">
              <input type="checkbox" name="category" value={type} defaultChecked={product?.category.includes(type)} /> {type}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description (optional)</label>
        <p className="mt-1 text-xs text-muted-foreground">Leave blank to automatically show our standard pre-owned item description on the product page.</p>
        <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Leave blank to use the standard description" className="mt-2 min-h-24 w-full border border-input bg-card px-3 py-2" />
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Feature on homepage
      </label>

      {isEdit && images.length > 0 && (
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current photos</label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((item) => (
              <label key={item.id} className="relative aspect-square overflow-hidden border border-border bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="size-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-background/90 py-1 text-[10px] font-bold uppercase">
                  <input type="checkbox" name="removeMediaIds" value={item.id} /> Remove
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isEdit && video && (
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current video</label>
          <div className="relative mt-2 max-w-xs">
            <video src={video.url} controls className="w-full bg-secondary" />
            <label className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase">
              <input type="checkbox" name="removeMediaIds" value={video.id} /> Remove video
            </label>
          </div>
        </div>
      )}

      <ProductMediaPicker imagesRequired={!isEdit} submitLabel={isEdit ? "Save changes" : "Create product"} />
    </form>
  )
}
