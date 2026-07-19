"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type WhatsAppContextValue = {
  message: string | null
  setMessage: (message: string | null) => void
}

const WhatsAppContext = createContext<WhatsAppContextValue | null>(null)

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  return <WhatsAppContext.Provider value={{ message, setMessage }}>{children}</WhatsAppContext.Provider>
}

export function useWhatsAppMessage() {
  const ctx = useContext(WhatsAppContext)
  if (!ctx) throw new Error("useWhatsAppMessage must be used within WhatsAppProvider")
  return ctx
}