import { notFound } from 'next/navigation'
import { PresentationView } from '@/components/PresentationView'
import { fetchProfiles, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function PresentPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(), list = await fetchProfiles()
  const idx = list.findIndex((p) => p.murid.id === params.id)
  if (idx < 0) notFound()
  let canPrint = ['ADMIN', 'PK1', 'GURU_KELAS'].includes(user.role)
  if (user.role === 'FEEDER') {
    const { data } = await createClient().from('feeder_access').select('can_print').eq('murid_id', params.id).eq('feeder_id', user.feeder_id!).eq('status', 'AKTIF').maybeSingle()
    canPrint = !!data?.can_print
  }
  return <PresentationView user={{ id: user.id, role: user.role }} data={list[idx]} prevId={list[idx - 1]?.murid.id ?? null} nextId={list[idx + 1]?.murid.id ?? null}
    position={idx + 1} total={list.length} options={list.map((p) => ({ id: p.murid.id, nama: p.murid.nama_murid }))} canPrint={canPrint} />
}
