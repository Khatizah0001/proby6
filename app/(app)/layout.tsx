import { AppShell } from '@/components/layout/AppShell'
import { getCurrentUser } from '@/lib/data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return <AppShell user={{ id: user.id, nama: user.nama, role: user.role }}>{children}</AppShell>
}
