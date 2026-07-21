import Link from "next/link"
import { Logo } from "@/components/logo"

const WHATSAPP_NUMBER = "923413907007"
const INSTAGRAM_URL = "https://www.instagram.com/prime_solespk"
const FACEBOOK_URL = "https://facebook.com/primesoles.pk"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like some help finding the right pair on Prime Soles.")}`

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.06 5.66 21.2 10.44 21.95V14.9H7.9v-2.84h2.54v-2.17c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.84h2.78l-.44 2.84h-2.34v7.05C18.34 21.2 22 17.06 22 12.06z" />
    </svg>
  )
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.601 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
  )
}

export function SiteFooter() {
  return <footer className="border-t border-border bg-foreground text-background"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6"><div className="md:col-span-2"><Logo variant="secondary"/><p className="mt-3 max-w-sm text-sm leading-6 text-background/70">Curated second-life sneakers, cleaned and condition-checked in Pakistan. Better pairs, lighter footprint.</p><div className="mt-5 flex items-center gap-3">
    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Prime Soles on Instagram" className="flex size-9 items-center justify-center text-background/80 transition-colors hover:text-[#E1306C]">
      <InstagramGlyph className="size-4.5" />
    </a>
    <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Prime Soles on Facebook" className="flex size-9 items-center justify-center text-background/80 transition-colors hover:text-[#1877F2]">
      <FacebookGlyph className="size-4.5" />
    </a>
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Chat with Prime Soles on WhatsApp" className="flex size-9 items-center justify-center text-background/80 transition-colors hover:text-[#25D366]">
      <WhatsAppGlyph className="size-4.5" />
    </a>
  </div></div><div><h2 className="text-sm font-bold uppercase tracking-widest">Shop</h2><div className="mt-4 flex flex-col gap-3 text-sm text-background/70"><Link href="/shop">All shoes</Link><Link href="/condition-guide">Condition guide</Link><Link href="/about">Our process</Link><Link href="/track">Track order</Link><Link href="/return-policy">Return policy</Link></div></div><div><h2 className="text-sm font-bold uppercase tracking-widest">Help</h2><div className="mt-4 flex flex-col gap-3 text-sm text-background/70"><span>COD nationwide</span><span>WhatsApp support</span><a href="tel:+923413907007" className="hover:text-background transition-colors">+92 341 3907007</a><a href="mailto:support@primesoles.pk" className="hover:text-background transition-colors break-all">support@primesoles.pk</a></div></div></div><div className="border-t border-background/15 px-4 py-5 text-center text-xs text-background/60">© 2026 Prime Soles. Built for better rotation.</div></footer>
}
