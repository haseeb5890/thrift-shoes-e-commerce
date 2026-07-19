"use client"

import Link from "next/link"
import { useWhatsAppMessage } from "@/components/whatsapp-provider"

const WHATSAPP_NUMBER = "923413907007"
const DEFAULT_MESSAGE = "Hi! I'd like some help finding the right pair on Prime Soles."

export function SiteFooter() {
  const { message } = useWhatsAppMessage()

  // Generate dynamic, context-aware URL syncing perfectly with your Floating Action Button
  const text = encodeURIComponent(message ?? DEFAULT_MESSAGE)
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <div className="font-serif text-3xl font-black">Prime Soles</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-background/70">
            Curated second-life sneakers, cleaned and condition-checked in Pakistan. Better pairs, lighter footprint.
          </p>
        </div>
        
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest">Shop</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-background/70">
            <Link href="/shop" className="hover:text-background transition-colors">All shoes</Link>
            <Link href="/condition-guide" className="hover:text-background transition-colors">Condition guide</Link>
            <Link href="/about" className="hover:text-background transition-colors">Our process</Link>
            <Link href="/track" className="hover:text-background transition-colors">Track order</Link>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest">Help</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-background/70">
            <Link href="/size-guide" className="hover:text-background transition-colors">Size guide</Link>
            <Link href="/return-policy" className="hover:text-background transition-colors">Return policy</Link>
            
            {/* Visual reassurance indicator */}
            <span className="text-background/90 font-medium">✓ COD nationwide</span>
            
            {/* Interactive WhatsApp anchor leveraging context provider hook */}
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#25D366] transition-colors font-medium"
            >
              WhatsApp support
            </a>
            
            {/* Actionable Mail Support protocol */}
            <a 
              href="mailto:support@primesoles.pk" 
              className="hover:text-background transition-colors break-all"
            >
              support@primesoles.pk
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-background/15 px-4 py-5 text-center text-xs text-background/60">
        © 2026 Prime Soles PK. Built for better rotation.
      </div>
    </footer>
  )
}