import { redirect } from 'next/navigation'
import { resolveAuthContext } from '@/lib/auth'
import { CategoryForm } from '../category-form'

export default async function NewCategoryPage() {
  const result = await resolveAuthContext()
  if (!result.ok) redirect('/login')

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New category</h1>
        <p className="text-sm text-gray-500 mt-1">Group related menu items together</p>
      </div>
      <CategoryForm />
    </div>
  )
}
