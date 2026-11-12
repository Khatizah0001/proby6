'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Edit3, Eye, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { initials, maskIC, riskFlags, STATUS_STYLE } from '@/lib/student-utils'
import type { StatusProfil, StudentProfileData } from '@/types/student'

export function StatusBadge({ s }: { s: StatusProfil }) {
  const st = STATUS_STYLE[s]
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1', st.cls)}><span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />{st.label}</span>
}

export function StudentList({ items, canEdit, showClassFilter = true }: { items: StudentProfileData[]; canEdit: boolean; showClassFilter?: boolean }) {
  const [q, setQ] = useState(''), [kelas, setKelas] = useState(''), [status, setStatus] = useState(''), [risk, setRisk] = useState(false)
  const kelasList = useMemo(() => Array.from(new Set(items.map((i) => i.murid.kelas))).sort(), [items])
  const list = items.filter((p) => (!q || p.murid.nama_murid.toLowerCase().includes(q.toLowerCase())) && (!kelas || p.murid.kelas === kelas) && (!status || p.murid.status_profil === status) && (!risk || riskFlags(p).length > 0))
  const sel = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama murid…" className="pl-9" aria-label="Cari murid" /></div>
        {showClassFilter && kelasList.length > 1 && <select className={sel} value={kelas} onChange={(e) => setKelas(e.target.value)} aria-label="Kelas"><option value="">Semua Kelas</option>{kelasList.map((k) => <option key={k}>{k}</option>)}</select>}
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Semua Status</option>{(Object.keys(STATUS_STYLE) as StatusProfil[]).map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}</select>
        <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" className="h-4 w-4 accent-violet-600" checked={risk} onChange={(e) => setRisk(e.target.checked)} />Berisiko sahaja</label>
        <span className="ml-auto text-xs text-slate-500">{list.length} murid</span>
      </div>
      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500"><Users className="mx-auto mb-3 h-10 w-10 text-slate-300" /><b className="block text-[#14204A]">Tiada murid dijumpai</b>Cuba ubah carian atau tapisan, atau semak sama ada murid sudah ditetapkan kepada anda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => {
            const m = p.murid, k = p.kelengkapan!, flags = riskFlags(p)
            return (
              <div key={m.id} className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
                <div className="flex items-center gap-3">
                  {m.photo_url ? <img src={m.photo_url} alt={`Gambar ${m.nama_murid}`} className="h-12 w-12 shrink-0 rounded-2xl object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-extrabold text-white">{initials(m.nama_murid)}</div>}
                  <div className="min-w-0"><div className="truncate text-sm font-bold">{m.nama_murid}</div><div className="text-xs text-slate-500">{maskIC(m.no_kp_masked)} · {m.kelas}</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5"><StatusBadge s={m.status_profil} />{flags.map((f) => <span key={f} className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700"><AlertTriangle className="h-3 w-3" />{f}</span>)}</div>
                <div><div className="mb-1 flex justify-between text-xs font-semibold"><span>Kelengkapan</span><span>{k.siap}/{k.jumlah}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600" style={{ width: `${(k.siap / k.jumlah) * 100}%` }} /></div></div>
                <div className="grid grid-cols-2 gap-2 text-xs"><div className="text-slate-500">Purata<b className="block text-sm text-[#14204A]">{p.akademik?.purata ?? '—'}{p.akademik ? '%' : ''}</b></div><div className="text-slate-500">Kehadiran<b className="block text-sm text-[#14204A]">{p.kehadiran ? `${p.kehadiran.peratus}%` : '—'}</b></div></div>
                <div className="mt-auto flex gap-2"><Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/murid/${m.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" />Lihat</Link></Button>{canEdit && <Button asChild size="sm" className="flex-1"><Link href={`/murid/${m.id}/edit`}><Edit3 className="mr-1.5 h-3.5 w-3.5" />Isi / Kemas Kini</Link></Button>}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
