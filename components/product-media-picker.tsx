"use client"

import { useState } from "react"
import { X } from "lucide-react"
import imageCompression from "browser-image-compression"
import { getMediaUploadUrl } from "@/app/actions/media"

async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })
  } catch {
    return file // compression is best-effort — fall back to the original rather than block the upload
  }
}

/** Uploads straight from the browser to R2 via a presigned URL — the file never touches our
 * server, so there's no serverless body-size limit to worry about even for video. */
async function uploadToR2(file: File, kind: "image" | "video"): Promise<string> {
  const result = await getMediaUploadUrl({ fileName: file.name, contentType: file.type, size: file.size, kind })
  if ("error" in result) throw new Error(result.error)

  const response = await fetch(result.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
  if (!response.ok) throw new Error("Upload failed — please try again.")

  return result.publicUrl
}

type MediaEntry = { previewUrl: string; publicUrl: string | null; error: string | null }

export function ProductMediaPicker({ imagesRequired = true, submitLabel }: { imagesRequired?: boolean; submitLabel: string }) {
  const [images, setImages] = useState<MediaEntry[]>([])
  const [video, setVideo] = useState<MediaEntry | null>(null)

  async function onImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    // Reset the input so choosing the same file again (e.g. after removing it) still fires onChange.
    e.target.value = ""
    if (files.length === 0) return

    const next = files.map((file) => ({ previewUrl: URL.createObjectURL(file), publicUrl: null as string | null, error: null as string | null }))
    // Append to whatever's already staged — picking photos one at a time should build up the
    // list, not replace the ones already selected but not yet confirmed.
    setImages((prev) => [...prev, ...next])

    const results = await Promise.all(
      files.map(async (file, index) => {
        try {
          const compressed = await compressImage(file)
          return { ...next[index], publicUrl: await uploadToR2(compressed, "image") }
        } catch (err) {
          return { ...next[index], error: err instanceof Error ? err.message : "Upload failed" }
        }
      }),
    )
    setImages((prev) => prev.map((img) => results.find((r) => r.previewUrl === img.previewUrl) ?? img))
  }

  function removeImage(previewUrl: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.previewUrl === previewUrl)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.previewUrl !== previewUrl)
    })
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (video) URL.revokeObjectURL(video.previewUrl)
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) { setVideo(null); return }
    const entry: MediaEntry = { previewUrl: URL.createObjectURL(file), publicUrl: null, error: null }
    setVideo(entry)
    try {
      setVideo({ ...entry, publicUrl: await uploadToR2(file, "video") })
    } catch (err) {
      setVideo({ ...entry, error: err instanceof Error ? err.message : "Upload failed" })
    }
  }

  const readyImageCount = images.filter((img) => img.publicUrl).length
  const stillUploading = images.some((img) => !img.publicUrl && !img.error) || Boolean(video && !video.publicUrl && !video.error)
  const hasFailedUpload = images.some((img) => img.error) || Boolean(video?.error)
  const canSubmit = !stillUploading && !hasFailedUpload && (!imagesRequired || readyImageCount > 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product photos (multiple angles)</label>
        <input type="file" accept="image/*" multiple onChange={onImagesChange} className="mt-2 block w-full text-sm" />
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, index) => (
              <div key={img.previewUrl} className="relative aspect-square overflow-hidden border border-border bg-secondary">
                <img src={img.previewUrl} alt={`Preview ${index + 1}`} className="size-full object-cover" />
                {!img.publicUrl && !img.error && <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-[10px] font-bold uppercase">Uploading...</div>}
                {img.error && <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 p-1 text-center text-[9px] font-bold text-destructive-foreground">{img.error}</div>}
                {img.publicUrl && <input type="hidden" name="imageUrls" value={img.publicUrl} />}
                <button
                  type="button"
                  onClick={() => removeImage(img.previewUrl)}
                  aria-label={`Remove preview ${index + 1}`}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {imagesRequired && images.length === 0 && <p className="mt-1 text-xs text-muted-foreground">At least one photo is required.</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product video (optional, max 30s / 5MB)</label>
        <p className="mt-1 text-xs text-muted-foreground">Compress it first with the local video-compressor tool (in the <code>video-compressor</code> project alongside this one).</p>
        <input type="file" accept="video/*" onChange={onVideoChange} className="mt-2 block w-full text-sm" />
        {video && (
          <div className="relative mt-3 max-w-xs">
            <video src={video.previewUrl} controls className="w-full bg-secondary" />
            {!video.publicUrl && !video.error && <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">Uploading...</p>}
            {video.error && <p className="mt-1 text-xs font-bold text-destructive">{video.error}</p>}
            {video.publicUrl && <input type="hidden" name="videoUrl" value={video.publicUrl} />}
          </div>
        )}
      </div>
      {hasFailedUpload && <p className="text-sm font-bold text-destructive">Some files failed to upload — reselect them before submitting.</p>}
      <button type="submit" disabled={!canSubmit} className="h-12 bg-primary font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
        {stillUploading ? "Uploading..." : submitLabel}
      </button>
    </div>
  )
}
