"use client"

import { useEffect, useState } from "react"

export function ProductMediaPicker({ imagesRequired = true }: { imagesRequired?: boolean }) {
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  useEffect(() => () => { imagePreviews.forEach((url) => URL.revokeObjectURL(url)); if (videoPreview) URL.revokeObjectURL(videoPreview) }, [imagePreviews, videoPreview])

  function onImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    const files = Array.from(e.target.files ?? [])
    setImagePreviews(files.map((file) => URL.createObjectURL(file)))
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    const file = e.target.files?.[0]
    setVideoPreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product photos (multiple angles)</label>
        <input type="file" name="images" accept="image/*" multiple required={imagesRequired} onChange={onImagesChange} className="mt-2 block w-full text-sm" />
        {imagePreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {imagePreviews.map((src, index) => (
              <div key={src} className="relative aspect-square overflow-hidden border border-border bg-secondary">
                <img src={src} alt={`Preview ${index + 1}`} className="size-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product video (optional)</label>
        <input type="file" name="video" accept="video/*" onChange={onVideoChange} className="mt-2 block w-full text-sm" />
        {videoPreview && (
          <video src={videoPreview} controls className="mt-3 max-h-64 w-full bg-secondary" />
        )}
      </div>
    </div>
  )
}
