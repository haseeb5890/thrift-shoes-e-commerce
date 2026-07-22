export default function ShopLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-6 md:py-16">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <div className="h-3 w-32 animate-pulse bg-secondary" />
          <div className="mt-3 h-11 w-64 animate-pulse bg-secondary" />
        </div>
      </div>
      <div className="flex flex-col gap-8 py-6 md:flex-row md:gap-10">
        <aside className="hidden md:block md:w-64 md:shrink-0" />
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-6">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="mt-4 h-3 w-20 bg-secondary" />
                <div className="mt-2 h-5 w-32 bg-secondary" />
                <div className="mt-2 h-4 w-16 bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
