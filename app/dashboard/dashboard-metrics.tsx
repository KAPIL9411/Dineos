import { ShoppingBag, IndianRupee, Clock, ChefHat, CheckCircle2, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface DashboardMetricsCardsProps {
  todayOrders: number
  todayRevenue: string
  pendingOrders: number
  activeOrders: number
  completedOrders: number
  averageOrderValue: string
}

export function DashboardMetricsCards({
  todayOrders,
  todayRevenue,
  pendingOrders,
  activeOrders,
  completedOrders,
  averageOrderValue,
}: DashboardMetricsCardsProps) {
  const metrics = [
    { label: "Today's Orders", value: String(todayOrders), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "Today's Revenue", value: todayRevenue, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: String(pendingOrders), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Active', value: String(activeOrders), icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completed', value: String(completedOrders), icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Avg Order Value', value: averageOrderValue, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
