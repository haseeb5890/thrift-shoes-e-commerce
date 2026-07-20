import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"

export const metadata: Metadata = { title: "Contact" }

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.601 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
  )
}

const CONTACT_METHODS = [
  {
    icon: WhatsAppGlyph,
    label: "WhatsApp",
    value: "+92 341 3907007",
    href: `https://wa.me/923413907007?text=${encodeURIComponent("Hi! I have a question about Prime Soles.")}`,
    hoverColor: "hover:border-[#25D366] hover:text-[#25D366]",
  },
  {
    icon: Phone,
    label: "Call",
    value: "+92 341 3907007",
    href: "tel:+923413907007",
    hoverColor: "hover:border-primary hover:text-primary",
  },
  {
    icon: Mail,
    label: "Email",
    value: "support@primesoles.pk",
    href: "mailto:support@primesoles.pk",
    hoverColor: "hover:border-primary hover:text-primary",
  },
]

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">We're here to help</p>
      <h1 className="mt-3 text-balance font-serif text-5xl font-black leading-none md:text-6xl">Get in touch.</h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
        Questions about an order, a specific pair, or sizing? Reach us however's easiest — we usually reply within a
        few hours.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {CONTACT_METHODS.map((method) => (
          <a
            key={method.label}
            href={method.href}
            target={method.href.startsWith("http") ? "_blank" : undefined}
            rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`flex flex-col items-start gap-3 border border-border p-5 transition-colors ${method.hoverColor}`}
          >
            <method.icon className="size-6" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{method.label}</p>
              <p className="mt-1 text-sm font-bold text-foreground">{method.value}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-10 flex items-start gap-4 bg-secondary p-6 md:p-8">
        <MapPin size={26} className="mt-1 shrink-0 text-accent" />
        <div>
          <p className="font-serif text-xl font-black">Nationwide delivery, Pakistan-based.</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            We ship COD to every major city across Pakistan. For order-specific questions, have your order number
            ready when you reach out.
          </p>
        </div>
      </div>
    </section>
  )
}
