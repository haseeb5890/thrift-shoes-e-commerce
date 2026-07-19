"use server"

import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { requireAdminAction } from "@/lib/auth-helpers"
import { listUsers } from "@/app/actions/users"
import { toCsv } from "@/lib/csv"

export async function exportProductsCsv(): Promise<string> {
  await requireAdminAction()
  const rows = await db.select().from(products).orderBy(desc(products.createdAt))
  return toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "brand", label: "Brand" },
    { key: "category", label: "Type" },
    { key: "gender", label: "Gender" },
    { key: "size", label: "Size" },
    { key: "condition", label: "Condition" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "isActive", label: "Active" },
    { key: "createdAt", label: "Created At" },
  ])
}

export async function exportUsersCsv(): Promise<string> {
  await requireAdminAction()
  const rows = await listUsers()
  return toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "banned", label: "Banned" },
  ])
}