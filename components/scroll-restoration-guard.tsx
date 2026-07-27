"use client"

import { useEffect } from "react"

// The browser's own history.scrollRestoration ("auto" by default) fires its own scroll
// restoration on back/forward navigation almost immediately — before React even mounts — and
// that guess doesn't match what ProductGrid's own sessionStorage-based restore is about to
// apply. Worse, ProductGrid's scroll-persist effect can capture and save that wrong intermediate
// position, clobbering the correct one. Handing scroll control entirely to the app avoids the race.
export function ScrollRestorationGuard() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual"
  }, [])
  return null
}
