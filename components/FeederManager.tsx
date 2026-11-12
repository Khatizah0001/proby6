'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, School, Share2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/StudentList'
import type { StatusProfil } from '@/types/student'

interface Feeder { id: string; nama: string; sekolah_menengah: string | null }
interface Access { feeder_id: string; murid_id: string; can_print: boolean; status: string }
interface M { id: string; nama_murid: string; kelas: string; feeder_id: string | null; status_profil: StatusProfil }

/** Urus akses feeder: read-only sentiasa. Setiap perubahan dilog automatik oleh trigger DB (SHARE/UNSHARE). */
export function FeederManager({ userId, feeders, access, murid }: { userId: string; feeders: Feeder[]; access: Access[]; murid: M[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-gradient-to-r from-[#0B1437] via-blue-600 to-violet-600 p-7 text-white shadow-xl"><h1 className="text-2xl font-extrabold">Feeder Access</h1><p className="mt-1 text-white/80">Akses read-only. Setiap perkongsian direkod dalam audit log.</p></section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {feeders.map((f) => {
          const rows = access.filter((a) => a.feeder_id === f.id), active = rows.filter((a) => a.status === 'AKTIF').length
          return (
            <Card key={f.id} className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-base font-extrabold"><School className="h-4 w-4 text-violet-600" />{f.nama}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">READ-ONLY</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{active} aktif</span><span className={`rounded-full px-2.5 py-1 ${rows.some((r) => r.can_print) ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>{rows.some((r) => r.can_print) ? 'Boleh Cetak' : 'Tanpa Cetak'}</span></div>
                <Button size="sm" onClick={() => setOpenId(openId === f.id ? null : f.id)}><Share2 className="mr-1.5 h-3.5 w-3.5" />{openId === f.id ? 'Tutup' : 'Urus Akses'}</Button>
              </CardContent></Card>
          )
        })}
      </div>
      {openId && <Editor key={openId} userId={userId} feeder={feeders.find((f) => f.id === openId)!} rows={access.filter((a) => a.feeder_id === openId)} murid={murid.filter((m) => m.feeder_id === openId)} />}
    </div>
  )
}

function Editor({ userId, feeder, rows, murid }: { userId: string; feeder: Feeder; rows: Access[]; murid: M[] }) {
  const router = useRouter()
  const [sel, setSel] = useState<Set<string>>(new Set(rows.map((r) => r.murid_id)))
  const [canPrint, setCanPrint] = useState(rows.some((r) => r.can_print)), [aktif, setAktif] = useState(rows.length === 0 || rows.some((r) => r.status === 'AKTIF')), [busy, setBusy] = useState(false)
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const eligible = (m: M) => ['LENGKAP', 'DISAHKAN', 'DIKONGSI', 'DICETAK'].includes(m.status_profil)

  async function save() {
    setBusy(true)
    const supabase = createClient(), existing = new Set(rows.map((r) => r.murid_id)), status = aktif ? 'AKTIF' : 'TIDAK_AKTIF'
    try {
      const remove = [...existing].filter((id) => !sel.has(id))
      if (remove.length) { const r = await supabase.from('feeder_access').delete().eq('feeder_id', feeder.id).in('murid_id', remove); if (r.error) throw r.error }
      const upserts = [...sel].map((murid_id) => ({ feeder_id: feeder.id, murid_id, can_print: canPrint, status, access_level: 'READ_ONLY', shared_by: userId }))
      if (upserts.length) { const r = await supabase.from('feeder_access').upsert(upserts, { onConflict: 'feeder_id,murid_id' }); if (r.error) throw r.error }
      // Status profil murid -> DIKONGSI (jika sudah lengkap/disahkan) / kembali DISAHKAN apabila akses dibatalkan
      const ids = [...sel].filter((id) => { const m = murid.find((x) => x.id === id); return m && ['LENGKAP', 'DISAHKAN'].includes(m.status_profil) })
      if (ids.length && aktif) await supabase.from('murid').update({ status_profil: 'DIKONGSI' }).in('id', ids)
      toast.success('Akses disimpan', { description: `${sel.size} murid dikongsi kepada ${feeder.nama}. Direkod dalam audit log.` }); router.refresh()
    } catch (e) { toast.error('Gagal menyimpan akses', { description: (e as { message?: string }).message ?? 'Ralat tidak diketahui' }) } finally { setBusy(false) }
  }
  return (
    <Card className="rounded-3xl border-violet-200"><CardHeader><CardTitle className="flex items-center gap-2 font-extrabold"><ShieldCheck className="h-4 w-4 text-violet-600" />Urus Akses — {feeder.nama}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-5 text-sm font-semibold"><label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-violet-600" checked={canPrint} onChange={(e) => setCanPrint(e.target.checked)} />Benarkan cetakan</label><label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-violet-600" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />Akses aktif</label></div>
        <p className="text-xs text-slate-500">Hanya murid yang menyasarkan feeder ini disenaraikan. Disyorkan kongsi profil berstatus Lengkap/Disahkan sahaja.</p>
        {murid.length === 0 ? <div className="rounded-2xl border border-dashed py-8 text-center text-sm text-slate-500">Tiada murid menyasarkan feeder ini.</div> : (
          <div className="divide-y rounded-2xl border">{murid.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"><input type="checkbox" className="h-4 w-4 accent-violet-600" checked={sel.has(m.id)} onChange={() => toggle(m.id)} />
              <div className="min-w-0 flex-1"><div className="text-sm font-bold">{m.nama_murid}</div><div className="text-xs text-slate-500">{m.kelas}</div></div>
              {!eligible(m) && <span className="text-[11px] text-amber-600">belum lengkap</span>}<StatusBadge s={m.status_profil} /></label>))}</div>)}
        <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Simpan Akses</Button>
      </CardContent></Card>
  )
}
