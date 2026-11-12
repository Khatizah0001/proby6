'use client'
import { useMemo, useState } from 'react'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StudentList'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { createClient } from '@/lib/supabase/client'
import type { StudentProfileData } from '@/types/student'

/** Cetak pukal MVP: window.print() + print stylesheet. Setiap cetakan direkod dalam audit_log (RLS menyemak can_print). */
export function BulkPrint({ items, printableIds, userId, role }: { items: StudentProfileData[]; printableIds: string[]; userId: string; role: string }) {
  const [sel, setSel] = useState<Set<string>>(new Set()), [kelas, setKelas] = useState(''), [busy, setBusy] = useState(false)
  const kelasList = useMemo(() => Array.from(new Set(items.map((i) => i.murid.kelas))).sort(), [items])
  const list = items.filter((p) => !kelas || p.murid.kelas === kelas)
  const ok = new Set(printableIds), chosen = items.filter((p) => sel.has(p.murid.id))
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function go() {
    if (!chosen.length) return toast.warning('Queue kosong', { description: 'Pilih sekurang-kurangnya seorang murid.' })
    setBusy(true)
    const { error } = await createClient().from('audit_log').insert(chosen.map((p) => ({ user_id: userId, role, action: 'PRINT', murid_id: p.murid.id })))
    setBusy(false)
    if (error) return toast.error('Cetakan ditolak', { description: 'Akaun anda tidak dibenarkan mencetak sebahagian profil dipilih.' })
    toast.success('Menyediakan cetakan', { description: `${chosen.length} profil direkod dalam audit log.` })
    setTimeout(() => window.print(), 350)
  }
  return (
    <>
      <div className="no-print grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {kelasList.length > 1 && <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={kelas} onChange={(e) => setKelas(e.target.value)} aria-label="Kelas"><option value="">Semua Kelas</option>{kelasList.map((k) => <option key={k}>{k}</option>)}</select>}
            <Button variant="outline" size="sm" onClick={() => setSel(new Set(list.filter((p) => ok.has(p.murid.id)).map((p) => p.murid.id)))}>Pilih Semua</Button><Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>Kosongkan</Button>
          </div>
          <Card className="rounded-3xl"><CardContent className="divide-y p-0">
            {list.length === 0 && <div className="py-12 text-center text-sm text-slate-500">Tiada murid untuk dicetak.</div>}
            {list.map((p) => { const can = ok.has(p.murid.id); return (
              <label key={p.murid.id} className={`flex items-center gap-3 px-5 py-3.5 ${can ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50'}`}>
                <input type="checkbox" className="h-4 w-4 accent-violet-600" disabled={!can} checked={sel.has(p.murid.id)} onChange={() => toggle(p.murid.id)} />
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{p.murid.nama_murid}</div><div className="text-xs text-slate-500">{p.murid.kelas} · {p.murid.feeder_nama ?? '—'}</div></div>
                {!can && <span className="text-[11px] text-slate-500">tiada kebenaran cetak</span>}<StatusBadge s={p.murid.status_profil} /></label>) })}
          </CardContent></Card>
        </div>
        <Card className="h-fit rounded-3xl xl:sticky xl:top-24"><CardHeader><CardTitle className="flex items-center gap-2 text-base font-extrabold"><Printer className="h-4 w-4 text-violet-600" />Batch Print Queue<span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs text-violet-700">{chosen.length}</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-64 overflow-auto text-sm">{chosen.length === 0 ? <div className="rounded-2xl border border-dashed py-6 text-center text-xs text-slate-500">Queue kosong — pilih murid di sebelah kiri.</div> : chosen.map((p) => <div key={p.murid.id} className="border-b border-dashed py-2 font-semibold last:border-0">{p.murid.nama_murid}</div>)}</div>
            <Button className="w-full" onClick={go} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}Jana PDF / Cetak</Button>
            <p className="text-[11px] text-slate-500">Pada dialog cetak, pilih &quot;Save as PDF&quot; untuk menjana PDF. Satu profil bagi setiap halaman.</p>
          </CardContent></Card>
      </div>
      <div aria-hidden>{chosen.map((p) => <div key={p.murid.id} className="print-only"><StudentProfileCard data={p} /></div>)}</div>
    </>
  )
}
