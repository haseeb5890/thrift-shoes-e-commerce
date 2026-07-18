"use client"

import "./globals.css"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Something went wrong</p>
          <h1 className="mt-3 text-4xl font-black">The site hit a snag.</h1>
          <p className="mt-4 text-muted-foreground">We&apos;re having trouble loading Prime Soles right now. Please try again in a moment.</p>
          <button onClick={() => reset()} className="mt-8 h-12 bg-primary px-6 font-bold text-primary-foreground">Try again</button>
        </div>
      </body>
    </html>
  )
}
