import { redirect } from 'next/navigation'
import { FeederManager } from '@/components/FeederManager'
import { CAN_SHARE, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function FeederAccessPage() {
  const user = await getCurrentUser()
  if (!CAN_SHARE.includes(user.role)) redirect('/dashboard')
  const supabase = createClient()
  const [{ data: feeders }, { data: access }, { data: murid }] = await Promise.all([
    supabase.from('feeder_school').select('id,nama,sekolah_menengah').order('nama'),
    supabase.from('feeder_access').select('feeder_id,murid_id,can_print,status'),
    supabase.from('murid').select('id,nama_murid,kelas,feeder_id,status_profil').order('kelas').order('nama_murid'),
  ])
  return <FeederManager userId={user.id} feeders={feeders ?? []} access={access ?? []} murid={murid ?? []} />
}
