import { getUserTags } from '@/lib/access'
import { Sidebar } from './Sidebar'

/**
 * Server component wrapper for Sidebar
 * Fetches user tags server-side and passes them to the client component
 */
export async function SidebarWrapper() {
  const userTags = await getUserTags()

  // Default to 'public' if user has no tags
  const tags = userTags.length > 0 ? userTags : ['public']

  return <Sidebar userTags={tags} />
}
