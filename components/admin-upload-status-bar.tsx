"use client"

import { useAdminProductUpload } from "@/components/admin-product-upload-provider"

export function AdminUploadStatusBar() {
  const { pending } = useAdminProductUpload()
  if (!pending) return null

  return (
    <div className="mb-6 flex items-center gap-3 border border-primary bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
      <span className="size-3 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      Saving &quot;{pending.label}&quot;... you can keep browsing, this will update automatically.
    </div>
  )
}
