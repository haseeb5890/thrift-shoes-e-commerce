import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3"

// R2 is S3-compatible, so the AWS SDK works against it directly — just point the endpoint at
// the account's R2 API URL instead of an AWS region.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME!

// Public base URL for reading uploaded files back (the r2.dev public URL, or a custom domain).
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

export function publicUrlFor(key: string) {
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
}

/** Reverses publicUrlFor — only works for URLs actually hosted under R2_PUBLIC_URL. */
export function keyFromPublicUrl(url: string): string | null {
  const base = R2_PUBLIC_URL.replace(/\/$/, "")
  return url.startsWith(`${base}/`) ? url.slice(base.length + 1) : null
}

/** Batch-deletes objects from the bucket. Silently ignores keys that don't parse as R2 URLs. */
export async function deleteMediaByUrls(urls: (string | null | undefined)[]) {
  const keys = urls.map((url) => (url ? keyFromPublicUrl(url) : null)).filter((key): key is string => Boolean(key))
  if (keys.length === 0) return
  await r2.send(new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: keys.map((Key) => ({ Key })) } }))
}
