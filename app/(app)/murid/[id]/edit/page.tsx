import { notFound, redirect } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'
import { CAN_EDIT, fetchProfile, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function EditPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!CAN_EDIT.includes(user.role)) redirect(`/murid/${params.id}`)
  const p = await fetchProfile(params.id)
  if (!p) notFound()
  const { data: feeders } = await createClient().from('feeder_school').select('id,nama').order('nama')
  return <ProfileForm data={p} feeders={feeders ?? []} />
}
