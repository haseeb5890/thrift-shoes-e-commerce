"use server"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { requireAdminAction } from "@/lib/auth-helpers"
import { r2, R2_BUCKET, publicUrlFor, deleteMediaByUrls } from "@/lib/r2"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB — client-side compression should land well under this

/**
 * Returns a short-lived presigned PUT URL so the admin's browser can upload the file straight to
 * R2 — the file never passes through the Next.js server, so there's no serverless body-size
 * limit to hit even for video.
 */
export async function getMediaUploadUrl(input: {
  fileName: string
  contentType: string
  size: number
  kind: "image" | "video"
}): Promise<{ error: string } | { uploadUrl: string; publicUrl: string }> {
  await requireAdminAction()

  if (input.kind === "image" && input.size > MAX_IMAGE_BYTES) {
    return { error: `Image must be under ${(MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(1)}MB.` }
  }
  if (input.kind === "image" && !input.contentType.startsWith("image/")) return { error: "File must be an image." }
  if (input.kind === "video" && !input.contentType.startsWith("video/")) return { error: "File must be a video." }

  const extension = input.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
  const key = `products/${crypto.randomUUID()}.${extension}`

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: input.contentType }),
    { expiresIn: 300 },
  )

  return { uploadUrl, publicUrl: publicUrlFor(key) }
}

/**
 * Called when the admin removes a photo/video from the picker after it already finished
 * uploading to R2 but before the product form was submitted — otherwise that file would sit in
 * storage forever, never referenced by any product row.
 */
export async function deleteStagedMediaUrl(url: string): Promise<void> {
  await requireAdminAction()
  await deleteMediaByUrls([url])
}
