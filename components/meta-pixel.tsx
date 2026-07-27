"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { trackPixelEvent } from "@/lib/meta-pixel"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function MetaPixel() {
  const pathname = usePathname()
  const lastFiredPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    if (!PIXEL_ID) return
    // The base snippet below already fires the initial PageView itself — this effect only
    // re-fires it on subsequent client-side (App Router) navigations, which change the URL
    // without a full page load the pixel would otherwise notice. Comparing against the
    // last-fired pathname (rather than a one-shot "isFirstRender" flag) is what keeps this
    // correct under React 18 StrictMode's dev-mode double-invocation of effects on mount, which
    // would otherwise turn "skip the first call" into "fire an extra PageView on the replay".
    if (lastFiredPathnameRef.current === pathname) return
    const isFirstRender = lastFiredPathnameRef.current === null
    lastFiredPathnameRef.current = pathname
    if (!isFirstRender) trackPixelEvent("PageView")
  }, [pathname])

  if (!PIXEL_ID) return null

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" alt="" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  )
}
