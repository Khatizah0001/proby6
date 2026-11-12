import { BulkPrint } from '@/components/BulkPrint'
import { fetchProfiles, getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function CetakPage() {
  const user = await getCurrentUser(), list = await fetchProfiles()
  let printable = list.map((p) => p.murid.id)
  if (user.role === 'FEEDER') {   // Feeder: hanya murid dengan can_print = true
    const { data } = await createClient().from('feeder_access').select('murid_id').eq('feeder_id', user.feeder_id!).eq('status', 'AKTIF').eq('can_print', true)
    printable = (data ?? []).map((d) => d.murid_id)
  }
  return <BulkPrint items={list} printableIds={printable} userId={user.id} role={user.role} />
}
