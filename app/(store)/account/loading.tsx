export default function AccountLoading() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 md:px-6">
      <div className="h-3 w-28 animate-pulse bg-secondary" />
      <div className="mt-3 h-9 w-64 animate-pulse bg-secondary md:h-11" />

      <div className="mt-10 grid gap-8 md:grid-cols-[0.7fr_1.3fr]">
        <div className="h-52 animate-pulse bg-secondary" />

        <div>
          <div className="h-8 w-32 animate-pulse bg-secondary" />
          <div className="mt-5 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
