import { redirect } from 'next/navigation'
import { ImportData } from '@/components/ImportData'
import { CAN_EDIT, fetchProfiles, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function ImportPage() {
  const user = await getCurrentUser()
  if (!CAN_EDIT.includes(user.role)) redirect('/dashboard')
  const supabase = createClient(), list = await fetchProfiles()
  const { data: feeders } = await supabase.from('feeder_school').select('id,nama').order('nama')
  const { data: gurus } = user.role === 'GURU_KELAS' ? { data: [] } : await supabase.from('users').select('id,nama').eq('role', 'GURU_KELAS').eq('status', 'AKTIF').order('nama')
  return <ImportData students={list.map((p) => ({ id: p.murid.id, nama: p.murid.nama_murid }))} feeders={feeders ?? []} gurus={gurus ?? []} userId={user.id} role={user.role} />
}
