"use client"

import { useEffect, useRef, useState } from "react"
import { Share2, MessageCircle, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"

function FacebookIcon({ size = 17, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  )
}

function InstagramIcon({ size = 17, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c-2.7 0-3.1 0-4.1.1-1.1.1-1.8.2-2.4.5-.7.3-1.2.6-1.8 1.2-.6.6-.9 1.1-1.2 1.8-.3.6-.4 1.3-.5 2.4C2 9 2 9.4 2 12s0 3.1.1 4.1c.1 1.1.2 1.8.5 2.4.3.7.6 1.2 1.2 1.8.6.6 1.1.9 1.8 1.2.6.3 1.3.4 2.4.5C9 22 9.4 22 12 22s3.1 0 4.1-.1c1.1-.1 1.8-.2 2.4-.5.7-.3 1.2-.6 1.8-1.2.6-.6.9-1.1 1.2-1.8.3-.6.4-1.3.5-2.4.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1.1-.2-1.8-.5-2.4-.3-.7-.6-1.2-1.2-1.8-.6-.6-1.1-.9-1.8-1.2-.6-.3-1.3-.4-2.4-.5C15.1 2 14.7 2 12 2Zm0 1.8c2.6 0 2.9 0 4 .1.9.1 1.5.2 1.8.3.5.2.8.4 1.1.7.3.3.5.6.7 1.1.1.3.3.9.3 1.8.1 1.1.1 1.4.1 4s0 2.9-.1 4c-.1.9-.2 1.5-.3 1.8-.2.5-.4.8-.7 1.1-.3.3-.6.5-1.1.7-.3.1-.9.3-1.8.3-1.1.1-1.4.1-4 .1s-2.9 0-4-.1c-.9-.1-1.5-.2-1.8-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.6-.7-1.1-.1-.3-.3-.9-.3-1.8-.1-1.1-.1-1.4-.1-4s0-2.9.1-4c.1-.9.2-1.5.3-1.8.2-.5.4-.8.7-1.1.3-.3.6-.5 1.1-.7.3-.1.9-.3 1.8-.3 1.1-.1 1.4-.1 4-.1Zm0 3.1a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2Zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6Zm5.3-8.6a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
    </svg>
  )
}

export function ShareButton({ title, text, path, className = "" }: { title: string; text: string; path: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSupportsNativeShare(typeof navigator !== "undefined" && "share" in navigator)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  async function handleShareClick() {
    if (supportsNativeShare) {
      const url = `${window.location.origin}${path}`
      try {
        await navigator.share({ title, text, url })
      } catch {
        // User cancelled the native share sheet — no-op.
      }
      return
    }
    setOpen((o) => !o)
  }

  async function copyLink(message = "Link copied to clipboard") {
    const url = `${window.location.origin}${path}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(message)
    } catch {
      toast.error("Couldn't copy the link — please copy it manually.")
    }
    setOpen(false)
  }

  function openShareWindow(shareUrl: string) {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=600")
    setOpen(false)
  }

  function buildUrls() {
    const url = `${window.location.origin}${path}`
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={handleShareClick} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider underline ${className}`}>
        <Share2 size={15} />
        Share
      </button>

      {open && !supportsNativeShare && (
        <div className="absolute left-0 top-full z-30 mt-2 w-60 border border-border bg-card p-2 shadow-lg">
          <button type="button" onClick={() => openShareWindow(buildUrls().whatsapp)} className="flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm font-semibold hover:bg-secondary">
            <MessageCircle size={17} className="text-[#25D366]" />
            WhatsApp
          </button>
          <button type="button" onClick={() => openShareWindow(buildUrls().facebook)} className="flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm font-semibold hover:bg-secondary">
            <FacebookIcon className="text-[#1877F2]" />
            Facebook
          </button>
          <button type="button" onClick={() => copyLink("Link copied — paste it into an Instagram DM")} className="flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm font-semibold hover:bg-secondary">
            <InstagramIcon className="text-[#E4405F]" />
            Instagram (copy link)
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" onClick={() => copyLink()} className="flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm font-semibold hover:bg-secondary">
            <LinkIcon size={17} />
            Copy link
          </button>
        </div>
      )}
    </div>
  )
}