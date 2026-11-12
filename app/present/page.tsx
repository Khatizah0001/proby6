import { redirect } from 'next/navigation'
import { fetchProfiles, getCurrentUser } from '@/lib/data'

export default async function PresentIndex() {
  await getCurrentUser()
  const list = await fetchProfiles()
  if (!list.length) redirect('/murid')
  redirect(`/present/${list[0].murid.id}`)
}
