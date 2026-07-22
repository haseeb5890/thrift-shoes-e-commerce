import { NextResponse } from "next/server"
import { and, eq, isNotNull, lt, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, productMedia } from "@/lib/db/schema"
import { deleteMediaByUrls } from "@/lib/r2"

const GRACE_PERIOD_DAYS = 30

/**
 * Runs daily (see vercel.json). One-of-one inventory never restocks once sold, so once a pair
 * has been sold out for GRACE_PERIOD_DAYS (long enough to cover returns/disputes — see the
 * 7-day return window in app/(store)/return-policy), its photos/video are deleted from R2 and
 * the listing itself is removed. order_items already has its own copy of the product's name/
 * size/price/image at the time of purchase, so past orders keep displaying correctly right up
 * until this cron actually deletes the image file — after that, only the image goes stale.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  const dueForCleanup = await db
    .select({ id: products.id, imageUrl: products.imageUrl })
    .from(products)
    .where(and(lte(products.stock, 0), isNotNull(products.soldAt), lt(products.soldAt, cutoff)))

  let deletedFiles = 0

  for (const product of dueForCleanup) {
    const media = await db.select({ url: productMedia.url }).from(productMedia).where(eq(productMedia.productId, product.id))
    const urls = [product.imageUrl, ...media.map((m) => m.url)]

    await deleteMediaByUrls(urls)
    deletedFiles += urls.length

    await db.delete(productMedia).where(eq(productMedia.productId, product.id))
    await db.delete(products).where(eq(products.id, product.id))
  }

  return NextResponse.json({ deletedProducts: dueForCleanup.length, deletedFiles })
}
