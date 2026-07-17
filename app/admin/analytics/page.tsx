import { getOrderAnalytics } from "@/app/actions/analytics"
import { AdminAnalyticsDashboard } from "@/components/admin-analytics-dashboard"

export default async function AdminAnalyticsPage() {
  const initialData = await getOrderAnalytics({ period: "7d", status: "all" })

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Sales performance</p>
      <h1 className="mt-2 font-serif text-5xl font-black">Revenue & orders.</h1>
      <div className="mt-8">
        <AdminAnalyticsDashboard initialData={initialData} />
      </div>
    </section>
  )
}