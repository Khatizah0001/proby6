import { notFound } from 'next/navigation'
import { ProfileActions } from '@/components/ProfileActions'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { CAN_EDIT, fetchProfile, getCurrentUser, logAudit } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function MuridProfilPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(), p = await fetchProfile(params.id)
  if (!p) notFound()   // RLS: murid di luar skop pengguna kelihatan seperti tidak wujud
  await logAudit(user, 'VIEW', p.murid.id)
  let canPrint = user.role === 'ADMIN' || user.role === 'PK1' || user.role === 'GURU_KELAS'
  if (user.role === 'FEEDER') {
    const { data } = await createClient().from('feeder_access').select('can_print').eq('murid_id', p.murid.id).eq('feeder_id', user.feeder_id!).eq('status', 'AKTIF').maybeSingle()
    canPrint = !!data?.can_print
  }
  const staff = user.role === 'ADMIN' || user.role === 'PK1'
  return (
    <>
      <ProfileActions muridId={p.murid.id} userId={user.id} role={user.role} canEdit={CAN_EDIT.includes(user.role)} canPrint={canPrint} canVerify={staff} complete={p.kelengkapan!.siap === p.kelengkapan!.jumlah} />
      <StudentProfileCard data={p} readOnly={user.role === 'FEEDER' || user.role === 'PPD'} />
    </>
  )
}
