'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toProfileClient } from '@/lib/profile-client'
import { cn } from '@/lib/utils'
import { computeStatus, maskIC, maskPhone } from '@/lib/student-utils'
import type { StudentProfileData } from '@/types/student'

type F = { k: string; l: string; t?: 'number' | 'date' | 'password'; o?: string[]; min?: number; max?: number }
const M3 = ['MAHIR', 'SEDERHANA', 'LEMAH']
const n = (k: string, l: string, min = 0, max = 100): F => ({ k, l, t: 'number', min, max })
/** Skema borang: satu sumber untuk UI + validasi Zod. Jadual -> medan. */
const SECTIONS: { key: string; table: string; label: string; fields: F[] }[] = [
  { key: 'murid', table: 'murid', label: 'Peribadi', fields: [
    { k: 'nama_murid', l: 'Nama Murid' }, { k: 'no_kp', l: 'No. KP (hanya versi masked disimpan)', t: 'password' }, { k: 'jantina', l: 'Jantina', o: ['L', 'P'] },
    { k: 'tarikh_lahir', l: 'Tarikh Lahir', t: 'date' }, { k: 'feeder_id', l: 'Feeder School Sasaran', o: [] }, { k: 'status_asrama', l: 'Status Asrama', o: ['ASRAMA', 'BUKAN_ASRAMA'] },
    { k: 'alamat', l: 'Alamat' }, { k: 'penjaga', l: 'Penjaga' }, { k: 'no_telefon', l: 'No. Telefon (hanya versi masked disimpan)', t: 'password' }, { k: 'bantuan', l: 'Bantuan' }, { k: 'masalah_kesihatan', l: 'Masalah Kesihatan' }] },
  { key: 'akademik', table: 'akademik', label: 'Akademik', fields: ['bm', 'bi', 'matematik', 'sains', 'sejarah', 'pendidikan_islam_moral', 'pjpk', 'muzik', 'psv', 'rbt'].map((k) => n(k, k.replace(/_/g, ' ').toUpperCase())) },
  { key: 'updlp6', table: 'updlp6', label: 'UP-DLP6', fields: [n('english', 'English'), n('science', 'Science'), n('mathematics', 'Mathematics')] },
  { key: 'tiga_m', table: 'tiga_m', label: '3M', fields: [{ k: 'membaca_bm', l: 'Membaca BM', o: M3 }, { k: 'menulis_bm', l: 'Menulis BM', o: M3 }, { k: 'reading_bi', l: 'Reading BI', o: M3 }, { k: 'writing_bi', l: 'Writing BI', o: M3 }, { k: 'mengira', l: 'Mengira', o: M3 }, { k: 'catatan', l: 'Catatan' }] },
  { key: 'psikometrik', table: 'psikometrik', label: 'Psikometrik', fields: ['verbal_linguistik', 'visual_ruang', 'logik_matematik', 'muzik', 'naturalis', 'kinestatik', 'interpersonal', 'intrapersonal', 'existential'].map((k) => n(k, k.replace(/_/g, ' '))) },
  { key: 'kokurikulum', table: 'kokurikulum', label: 'Kokurikulum', fields: ['unit_beruniform', 'jawatan_unit', 'kelab_persatuan', 'jawatan_kelab', 'sukan_permainan', 'jawatan_sukan'].map((k) => ({ k, l: k.replace(/_/g, ' ') })).concat([{ k: 'pencapaian', l: 'Pencapaian (asing dengan koma)' }]) },
  { key: 'kesihatan', table: 'kesihatan', label: 'Kesihatan', fields: [n('tinggi_cm', 'Tinggi (cm)', 80, 220), n('berat_kg', 'Berat (kg)', 10, 200), { k: 'pendengaran', l: 'Pendengaran' }, { k: 'penglihatan', l: 'Penglihatan' }, { k: 'pertuturan', l: 'Pertuturan' }, { k: 'kecacatan', l: 'Kecacatan' }, { k: 'catatan', l: 'Catatan' }] },
  { key: 'kehadiran', table: 'kehadiran', label: 'Kehadiran', fields: [n('jumlah_hari', 'Jumlah Hari', 1, 400), n('hadir', 'Hari Hadir', 0, 400)] },
  { key: 'ssdm', table: 'ssdm', label: 'SSDM', fields: [{ k: 'amalan_baik', l: 'Amalan Baik' }, n('kes_disiplin', 'Bil. Kes Disiplin', 0, 100), { k: 'catatan', l: 'Catatan' }] },
]

/** Zod: nombor dalam julat; kosong dibenarkan (medan pilihan). */
function zodFor(fields: F[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach((f) => {
    shape[f.k] = f.t === 'number'
      ? z.string().refine((v) => v === '' || (!isNaN(Number(v)) && Number(v) >= (f.min ?? 0) && Number(v) <= (f.max ?? 100)), `${f.l}: nilai mesti antara ${f.min ?? 0} dan ${f.max ?? 100}`)
      : z.string().max(300, `${f.l} terlalu panjang`)
  })
  return z.object(shape)
}

export function ProfileForm({ data, feeders }: { data: StudentProfileData; feeders: { id: string; nama: string }[] }) {
  const router = useRouter()
  const init: Record<string, Record<string, string>> = {}
  const src: Record<string, Record<string, unknown> | null | undefined> = { murid: data.murid as never, akademik: data.akademik as never, updlp6: data.updlp6 as never, tiga_m: data.tigaM as never, psikometrik: data.psikometrik as never, kokurikulum: data.kokurikulum as never, kesihatan: data.kesihatan as never, kehadiran: data.kehadiran as never, ssdm: data.ssdm as never }
  SECTIONS.forEach((s) => { init[s.key] = {}; s.fields.forEach((f) => { const v = src[s.key]?.[f.k]; init[s.key][f.k] = f.t === 'password' ? '' : Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v) }) })
  const [vals, setVals] = useState(init), [tab, setTab] = useState('murid'), [saving, setSaving] = useState(false)
  const cur = SECTIONS.find((s) => s.key === tab)!
  const set = (k: string, v: string) => setVals((o) => ({ ...o, [tab]: { ...o[tab], [k]: v } }))
  const clean = (o: Record<string, string>, fields: F[]) => { const r: Record<string, unknown> = {}; fields.forEach((f) => { const v = (o[f.k] ?? '').trim(); if (v !== '') r[f.k] = f.t === 'number' ? Number(v) : v }); return r }

  async function save() {
    setSaving(true)
    const supabase = createClient(), id = data.murid.id
    try {
      for (const s of SECTIONS) {   // validasi semua bahagian dahulu
        const res = zodFor(s.fields).safeParse(vals[s.key])
        if (!res.success) { setTab(s.key); throw new Error(res.error.issues[0].message) }
      }
      // --- murid: IC & telefon dimaskkan DI PELAYAR; nilai penuh tidak pernah dihantar ---
      const mv = clean(vals.murid, SECTIONS[0].fields), { no_kp, no_telefon, ...mrest } = mv as Record<string, string>
      const mUpd: Record<string, unknown> = { ...mrest }
      if (no_kp) mUpd.no_kp_masked = maskIC(no_kp)
      if (no_telefon) mUpd.no_telefon_masked = maskPhone(no_telefon)
      if (mUpd.tarikh_lahir === undefined) delete mUpd.tarikh_lahir
      const r0 = await supabase.from('murid').update(mUpd).eq('id', id); if (r0.error) throw new Error(r0.error.message)
      // --- bahagian anak: upsert 1:1 ---
      for (const s of SECTIONS.slice(1)) {
        const row = clean(vals[s.key], s.fields)
        if (Object.keys(row).length === 0) continue
        if (s.key === 'kehadiran' && (row.jumlah_hari === undefined || row.hadir === undefined)) { toast.warning('Kehadiran tidak disimpan', { description: 'Isi Jumlah Hari dan Hari Hadir.' }); continue }
        if (s.key === 'kehadiran' && Number(row.hadir) > Number(row.jumlah_hari)) throw new Error('Hari hadir tidak boleh melebihi jumlah hari.')
        if (s.key === 'kokurikulum') row.pencapaian = String(vals.kokurikulum.pencapaian || '').split(',').map((x) => x.trim()).filter(Boolean)
        if (s.key === 'psikometrik') { let best = '', bv = -1; Object.entries(row).forEach(([k, v]) => { if (typeof v === 'number' && v > bv) { bv = v; best = k } }); row.dominan = best }
        const r = await supabase.from(s.table).upsert({ murid_id: id, ...row }, { onConflict: 'murid_id' }); if (r.error) throw new Error(`${s.label}: ${r.error.message}`)
      }
      // --- kira semula status kelengkapan ---
      const { data: fresh } = await supabase.from('murid').select('*, akademik(id), updlp6(id), tiga_m(id), psikometrik(id), kokurikulum(id), kesihatan(id), kehadiran(id), ssdm(id)').eq('id', id).single()
      if (fresh) {
        const p = toProfileClient(fresh), st = computeStatus(p.siap, p.jumlah, fresh.status_profil)
        if (st !== fresh.status_profil) { const r = await supabase.from('murid').update({ status_profil: st }).eq('id', id); if (r.error) throw new Error(r.error.message) }
      }
      toast.success('Profil disimpan', { description: data.murid.nama_murid }); router.push(`/murid/${id}`); router.refresh()
    } catch (e) { toast.error('Gagal menyimpan', { description: (e as Error).message }) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Batal</Button>
        <div><h1 className="text-xl font-extrabold">Kemas Kini Profil</h1><p className="text-sm text-slate-500">{data.murid.nama_murid} · {data.murid.kelas}</p></div>
        <Button className="ml-auto" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Simpan Profil</Button></div>
      <div role="tablist" className="flex flex-wrap gap-2">{SECTIONS.map((s) => <button key={s.key} role="tab" aria-selected={tab === s.key} onClick={() => setTab(s.key)} className={cn('rounded-xl px-4 py-2 text-xs font-bold transition', tab === s.key ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-blue-600')}>{s.label}</button>)}</div>
      <Card className="rounded-3xl"><CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
        {cur.fields.map((f) => {
          const opts = f.k === 'feeder_id' ? feeders.map((x) => ({ v: x.id, l: x.nama })) : f.o?.map((x) => ({ v: x, l: x }))
          const cls = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
          return (<label key={f.k} className="block"><span className="mb-1.5 block text-xs font-semibold capitalize text-slate-500">{f.l}</span>
            {opts ? <select className={cls} value={vals[tab][f.k]} onChange={(e) => set(f.k, e.target.value)}><option value="" />{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
              : <input className={cls} type={f.t === 'number' ? 'number' : f.t ?? 'text'} min={f.min} max={f.max} step="any" value={vals[tab][f.k]} autoComplete="off" placeholder={f.t === 'password' ? '(kosongkan jika tidak diubah)' : ''} onChange={(e) => set(f.k, e.target.value)} />}</label>)
        })}
      </CardContent></Card>
      <p className="text-xs text-slate-500">Purata, BMI, peratus kehadiran, tafsiran dan risiko dikira automatik oleh pangkalan data.</p>
    </div>
  )
}
