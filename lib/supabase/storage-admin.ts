import { createAdminClient } from "@/lib/supabase/admin-client"

const PRODUCT_IMAGES_BUCKET = "product-images"

export async function uploadProductFile(file: File) {
  const supabase = createAdminClient()
  const extension = file.name.split(".").pop()
  const path = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const uploadProductImage = uploadProductFile
