export default function TrackLoading() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-10 md:px-6">
      <div className="h-3 w-40 animate-pulse bg-secondary" />
      <div className="mt-3 h-9 w-48 animate-pulse bg-secondary md:h-11" />

      <div className="mt-8 flex flex-col gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-secondary p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3 w-24 animate-pulse bg-background" />
              <div className="h-4 w-16 animate-pulse bg-background" />
            </div>
            <div className="mt-6 h-1.5 w-full animate-pulse bg-background" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {Array.from({ length: 5 }, (_, j) => (
                <div key={j} className="h-10 animate-pulse bg-background" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
