"use client"

import Link from "next/link"

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-black">This page hit a snag.</h1>
      <p className="mt-4 text-muted-foreground">We&apos;re having trouble reaching our servers right now. Please try again in a moment.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={() => reset()} className="h-12 bg-primary px-6 font-bold text-primary-foreground">Try again</button>
        <Link href="/" className="flex h-12 items-center border border-foreground px-6 font-bold">Go home</Link>
      </div>
    </div>
  )
}
