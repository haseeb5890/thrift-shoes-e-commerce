import type { Metadata, Viewport } from "next"
import { DM_Sans, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { WhatsAppProvider } from "@/components/whatsapp-provider"
import { WhatsAppFab } from "@/components/whatsapp-fab"
import { WishlistProvider } from "@/components/wishlist-provider"
import "./globals.css"

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const heading = Outfit({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = { title: { default: "Prime Soles — Curated thrift sneakers", template: "%s | Prime Soles" }, description: "Shop professionally cleaned, honestly graded thrift sneakers with delivery across Pakistan.", keywords: ["thrift shoes Pakistan", "used sneakers Pakistan", "pre-owned shoes"] }
export const viewport: Viewport = { themeColor: "#f4f1e8", colorScheme: "light", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${sans.variable} ${heading.variable} font-sans antialiased`}>
        <WhatsAppProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
          <WhatsAppFab />
        </WhatsAppProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontFamily: "var(--font-dm-sans)" },
          }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
