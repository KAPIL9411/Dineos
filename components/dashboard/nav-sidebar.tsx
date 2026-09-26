'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Table2,
  QrCode,
  Users,
  Truck,
  BarChart3,
  Settings,
  ChefHat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/tables', label: 'Tables', icon: Table2 },
  { href: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/staff', label: 'Staff', icon: Users },
  { href: '/dashboard/delivery', label: 'Delivery', icon: Truck },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface NavSidebarProps {
  restaurantName: string
}

export function NavSidebar({ restaurantName }: NavSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200">
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900 truncate">{restaurantName}</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Dashboard navigation">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Kitchen link + logout */}
      <div className="px-2 pb-4 space-y-1 border-t border-gray-100 pt-3">
        <Link
          href="/kitchen"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <ChefHat className="w-4 h-4" aria-hidden="true" />
          Kitchen Display
        </Link>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 px-3"
          >
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
