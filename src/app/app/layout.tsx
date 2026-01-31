import { DashboardNav } from "./_components/dashboard-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
