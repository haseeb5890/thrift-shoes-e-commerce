import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { promoCodes } from "@/lib/db/schema"
import { CreatePromoForm } from "@/components/create-promo-form"
import { PromoRowActions } from "@/components/promo-row-actions"

export default async function AdminPromosPage() {
  const promoRows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl font-black">Promo codes.</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="order-2 lg:order-1">
          <div className="overflow-x-auto bg-background p-5">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Discount</th>
                  <th className="px-3 py-3">Redeemed</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">No promo codes yet.</td></tr>
                ) : (
                  promoRows.map((promo) => (
                    <tr key={promo.id} className="border-b border-border">
                      <td className="px-3 py-4 font-bold tracking-wider">{promo.code}</td>
                      <td className="px-3 py-4">{promo.discountPercent}%</td>
                      <td className="px-3 py-4">{promo.usedCount} / {promo.maxUses}</td>
                      <td className="px-3 py-4">
                        <span className={`text-xs font-bold uppercase ${promo.isActive && promo.usedCount < promo.maxUses ? "text-accent" : "text-destructive"}`}>
                          {promo.usedCount >= promo.maxUses ? "Exhausted" : promo.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <PromoRowActions promoId={promo.id} isActive={promo.isActive} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="order-1 h-fit border border-border bg-background p-5 lg:order-2">
          <h2 className="font-serif text-2xl font-black">Create a promo</h2>
          <CreatePromoForm />
        </div>
      </div>
    </section>
  )
}
