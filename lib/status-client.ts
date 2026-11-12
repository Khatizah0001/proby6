import type { createClient } from '@/lib/supabase/client'
import { computeStatus } from '@/lib/student-utils'
import { toProfileClient } from '@/lib/profile-client'

type Client = ReturnType<typeof createClient>

/** Kira semula status kelengkapan untuk senarai murid (selepas import / muat naik). */
export async function recomputeStatuses(supabase: Client, ids: string[]) {
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase.from('murid')
      .select('id,status_profil,nama_murid,no_kp_masked,alamat,penjaga,feeder_id, akademik(id), updlp6(id,purata,slip_path), tiga_m(id), psikometrik(id), kokurikulum(id), kesihatan(id), kehadiran(id), ssdm(id)')
      .in('id', ids.slice(i, i + 100))
    for (const row of data ?? []) {
      const p = toProfileClient(row), st = computeStatus(p.siap, p.jumlah, row.status_profil)
      if (st !== row.status_profil) await supabase.from('murid').update({ status_profil: st }).eq('id', row.id)
    }
  }
}
