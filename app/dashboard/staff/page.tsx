import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { Users, UserPlus, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Staff Management',
}

export default async function StaffPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')
  const { staffMember, restaurant } = result.ctx

  // Only owners and managers can access
  if (!['RESTAURANT_OWNER', 'RESTAURANT_MANAGER'].includes(staffMember.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team members and permissions</p>
        </div>
        <Link href="/dashboard/staff/invite">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Staff
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {/* Current User */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
              {staffMember.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{staffMember.name}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                  You
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <Mail className="w-3.5 h-3.5" />
                {staffMember.email}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <Shield className="w-3.5 h-3.5" />
                {staffMember.role.replace('RESTAURANT_', '').replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">Staff Invitations Coming Soon</p>
          <p className="text-sm mt-1">
            Invite team members via email and assign roles
          </p>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Staff Roles</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div>
            <strong>Owner:</strong> Full access - manage staff, delete menu items, view analytics
          </div>
          <div>
            <strong>Manager:</strong> Create/edit menu, manage tables, process orders
          </div>
          <div>
            <strong>Kitchen Staff:</strong> View and update order status in kitchen display
          </div>
          <div>
            <strong>Waiter:</strong> Take orders, update table status
          </div>
        </div>
      </div>
    </div>
  )
}
