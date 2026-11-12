import { redirect } from 'next/navigation'
import { NewStudentForm } from '@/components/NewStudentForm'
import { CAN_EDIT, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function BaharuPage() {
  const user = await getCurrentUser()
  if (!CAN_EDIT.includes(user.role)) redirect('/murid')
  const supabase = createClient()
  const { data: feeders } = await supabase.from('feeder_school').select('id,nama').order('nama')
  const { data: gurus } = user.role === 'GURU_KELAS' ? { data: [] } : await supabase.from('users').select('id,nama').eq('role', 'GURU_KELAS').eq('status', 'AKTIF').order('nama')
  return <NewStudentForm feeders={feeders ?? []} gurus={gurus ?? []} userId={user.id} role={user.role} />
}
