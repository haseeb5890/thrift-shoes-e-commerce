"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type PendingUpload = { label: string } | null

const AdminProductUploadContext = createContext<{ pending: PendingUpload; start: (label: string) => void; finish: () => void } | null>(null)

// Mounted in app/admin/layout.tsx, which stays mounted across navigation between nested admin
// routes — that's what lets "start an upload on /admin/products/new, navigate immediately to
// /admin/products" carry the pending state across without resorting to sessionStorage.
export function AdminProductUploadProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingUpload>(null)
  return (
    <AdminProductUploadContext.Provider value={{ pending, start: (label) => setPending({ label }), finish: () => setPending(null) }}>
      {children}
    </AdminProductUploadContext.Provider>
  )
}

export function useAdminProductUpload() {
  const ctx = useContext(AdminProductUploadContext)
  if (!ctx) throw new Error("useAdminProductUpload must be used within AdminProductUploadProvider")
  return ctx
}
