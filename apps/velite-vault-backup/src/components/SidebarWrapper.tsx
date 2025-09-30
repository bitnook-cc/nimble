import { getAllContent } from '@/lib/content'
import { Sidebar } from './Sidebar'

// Server component wrapper - this calls getAllContent() on the server
export async function SidebarWrapper() {
  const navigation = getAllContent()
  return <Sidebar navigation={navigation} />
}