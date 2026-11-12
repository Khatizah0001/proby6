'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { maskIC } from '@/lib/student-utils'

/** Tambah murid baharu (enrolmen). No. KP dimaskkan di pelayar — nombor penuh tidak pernah dihantar ke pelayan. */
export function NewStudentForm({ feeders, gurus, userId, role }: { feeders: { id: string; nama: string }[]; gurus: { id: string; nama: string }[]; userId: string; role: string }) {
  const router = useRouter(), isGuru = role === 'GURU_KELAS'
  const [f, setF] = useState({ nama: '', ic: '', jantina: '', lahir: '', kelas: '6 Premier', guru: gurus[0]?.id ?? '', feeder: feeders[0]?.id ?? '', asrama: '' })
  const [busy, setBusy] = useState(false)
  const set = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }))
  const cls = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

  async function save() {
    if (f.nama.trim().length < 3) return toast.warning('Nama diperlukan', { description: 'Isi nama penuh murid.' })
    if (!f.jantina) return toast.warning('Jantina diperlukan', { description: 'Pilih L atau P.' })
    if (!isGuru && !f.guru) return toast.warning('Guru kelas diperlukan', { description: 'Pilih guru kelas bagi murid ini.' })
    setBusy(true)
    const { data, error } = await createClient().from('murid').insert({
      nama_murid: f.nama.trim().replace(/\s+/g, ' '), no_kp_masked: maskIC(f.ic), jantina: f.jantina, tarikh_lahir: f.lahir || null, kelas: f.kelas.trim() || '6 Premier',
      guru_kelas_id: isGuru ? userId : f.guru, feeder_id: f.feeder || null, status_asrama: f.asrama || null,
    }).select('id').single()
    setBusy(false)
    if (error || !data) return toast.error('Gagal menambah murid', { description: error?.message ?? 'Ralat tidak diketahui' })
    toast.success('Murid ditambah', { description: 'Sambung mengisi profil dan muat naik gambar.' })
    router.push(`/murid/${data.id}/edit`); router.refresh()
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Batal</Button><div><h1 className="text-xl font-extrabold">Tambah Murid Baharu</h1><p className="text-sm text-slate-500">Selepas disimpan, anda akan dibawa ke borang profil untuk melengkapkan maklumat dan memuat naik gambar.</p></div></div>
      <Card className="rounded-3xl"><CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Nama Penuh Murid *</span><input className={cls} value={f.nama} onChange={(e) => set('nama', e.target.value)} autoComplete="off" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">No. KP (hanya versi masked disimpan)</span><input className={cls} type="password" value={f.ic} onChange={(e) => set('ic', e.target.value)} autoComplete="off" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Jantina *</span><select className={cls} value={f.jantina} onChange={(e) => set('jantina', e.target.value)}><option value="" /><option value="L">Lelaki</option><option value="P">Perempuan</option></select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Tarikh Lahir</span><input className={cls} type="date" value={f.lahir} onChange={(e) => set('lahir', e.target.value)} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Kelas</span><input className={cls} value={f.kelas} onChange={(e) => set('kelas', e.target.value)} /></label>
        {!isGuru && <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Guru Kelas *</span><select className={cls} value={f.guru} onChange={(e) => set('guru', e.target.value)}><option value="" />{gurus.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}</select></label>}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Feeder School Sasaran</span><select className={cls} value={f.feeder} onChange={(e) => set('feeder', e.target.value)}><option value="" />{feeders.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Status Asrama</span><select className={cls} value={f.asrama} onChange={(e) => set('asrama', e.target.value)}><option value="" /><option value="ASRAMA">Asrama</option><option value="BUKAN_ASRAMA">Bukan Asrama</option></select></label>
      </CardContent></Card>
      <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Simpan &amp; Teruskan</Button>
    </div>
  )
}
