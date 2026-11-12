'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { downloadCsv, parseCsv } from '@/lib/csv'
import { maskIC, maskPhone } from '@/lib/student-utils'
import { recomputeStatuses } from '@/lib/status-client'
import { cn } from '@/lib/utils'

type Mode = 'murid' | 'kehadiran' | 'updlp6'
interface Student { id: string; nama: string }
interface PRow { line: number; label: string; ok: boolean; note: string; payload?: Record<string, unknown>; muridId?: string }

const TEMPLATES: Record<Mode, { title: string; desc: string; file: string; head: string[]; sample: string[] }> = {
  murid: { title: 'Senarai Murid (enrolmen)', desc: 'Tambah murid baharu secara pukal. Murid yang sudah ada (nama sama) akan dilangkau.', file: 'templat-murid.csv',
    head: ['nama_murid', 'no_kp', 'jantina', 'tarikh_lahir', 'kelas', 'feeder', 'asrama', 'alamat', 'penjaga', 'no_telefon', 'bantuan'],
    sample: ['AHMAD BIN ALI', '140101130001', 'L', '2014-01-01', '6 Premier', 'SMK Julau', 'ASRAMA', 'Rumah Panjang Nanga Luau, Julau', 'ALI BIN OMAR', '0121234567', 'KWAPM'] },
  kehadiran: { title: 'Kehadiran', desc: 'Kemas kini jumlah hari persekolahan dan hari hadir. Murid dipadankan mengikut nama.', file: 'templat-kehadiran.csv',
    head: ['nama_murid', 'jumlah_hari', 'hadir'], sample: ['AHMAD BIN ALI', '190', '182'] },
  updlp6: { title: 'Markah UP-DLP6', desc: 'Kemas kini markah English, Science dan Mathematics (0–100). Murid dipadankan mengikut nama.', file: 'templat-updlp6.csv',
    head: ['nama_murid', 'english', 'science', 'mathematics'], sample: ['AHMAD BIN ALI', '78', '82', '85'] },
}
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase()
const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_')
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function parseDate(v: string): string | null | 'INVALID' {
  const t = v.trim(); if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : 'INVALID'
}
const numOrNull = (v: string, min: number, max: number): number | null | 'INVALID' => { const t = v.trim(); if (!t) return null; const n = Number(t.replace(',', '.')); return isNaN(n) || n < min || n > max ? 'INVALID' : n }

async function readFile(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const mod = await import('read-excel-file')
    const rows = await mod.default(file)
    return rows.map((r) => r.map((c) => (c == null ? '' : c instanceof Date ? iso(c) : String(c))))
  }
  return parseCsv(await file.text())
}

export function ImportData({ students, feeders, gurus, userId, role }: { students: Student[]; feeders: { id: string; nama: string }[]; gurus: { id: string; nama: string }[]; userId: string; role: string }) {
  const router = useRouter(), input = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('kehadiran'), [rows, setRows] = useState<PRow[] | null>(null), [busy, setBusy] = useState(false), [guru, setGuru] = useState(gurus[0]?.id ?? ''), [fname, setFname] = useState('')
  const isGuru = role === 'GURU_KELAS', t = TEMPLATES[mode]
  const byName = new Map(students.map((s) => [norm(s.nama), s.id]))

  function build(raw: string[][]): PRow[] {
    const [head, ...body] = raw, cols = head.map(key)
    const get = (r: string[], c: string) => { const i = cols.indexOf(c); return i < 0 ? '' : (r[i] ?? '').trim() }
    const missing = t.head.filter((c) => c !== 'nama_murid' ? false : !cols.includes(c))
    if (missing.length) throw new Error('Lajur "nama_murid" tidak dijumpai. Gunakan templat yang disediakan.')
    const seen = new Set<string>()
    return body.map((r, idx) => {
      const line = idx + 2, nama = get(r, 'nama_murid'), label = nama || `(baris ${line})`, bad = (note: string): PRow => ({ line, label, ok: false, note })
      if (!nama) return bad('Nama murid kosong')
      if (mode === 'murid') {
        if (byName.has(norm(nama)) || seen.has(norm(nama))) return bad('Sudah ada / pendua — dilangkau')
        seen.add(norm(nama))
        const jRaw = get(r, 'jantina').toUpperCase(), jantina = jRaw.startsWith('L') ? 'L' : jRaw.startsWith('P') ? 'P' : ''
        if (!jantina) return bad('Jantina mesti L atau P')
        const lahir = parseDate(get(r, 'tarikh_lahir')); if (lahir === 'INVALID') return bad('Tarikh lahir tidak sah (gunakan YYYY-MM-DD)')
        const fn = get(r, 'feeder'), feeder = fn ? feeders.find((f) => norm(f.nama) === norm(fn)) : undefined
        if (fn && !feeder) return bad(`Feeder "${fn}" tidak dijumpai`)
        const as = norm(get(r, 'asrama')).replace(/\s/g, '_'), asrama = as.startsWith('BUKAN') ? 'BUKAN_ASRAMA' : as.startsWith('ASRAMA') ? 'ASRAMA' : null
        const ic = get(r, 'no_kp'), tel = get(r, 'no_telefon')
        return { line, label, ok: true, note: 'Sedia ditambah', payload: { nama_murid: nama.replace(/\s+/g, ' '), no_kp_masked: maskIC(ic), jantina, tarikh_lahir: lahir, kelas: get(r, 'kelas') || '6 Premier', feeder_id: feeder?.id ?? null,
          status_asrama: asrama, alamat: get(r, 'alamat') || null, penjaga: get(r, 'penjaga') || null, no_telefon_masked: tel ? maskPhone(tel) : null, bantuan: get(r, 'bantuan') || null } }
      }
      const id = byName.get(norm(nama)); if (!id) return bad('Murid tidak dijumpai dalam senarai anda')
      if (seen.has(id)) return bad('Baris pendua untuk murid yang sama'); seen.add(id)
      if (mode === 'kehadiran') {
        const jh = numOrNull(get(r, 'jumlah_hari'), 1, 400), h = numOrNull(get(r, 'hadir'), 0, 400)
        if (jh === 'INVALID' || jh === null) return bad('Jumlah hari tidak sah'); if (h === 'INVALID' || h === null) return bad('Hari hadir tidak sah')
        if (h > jh) return bad('Hari hadir melebihi jumlah hari')
        return { line, label, ok: true, note: `${h}/${jh} hari (${Math.round((h / jh) * 1000) / 10}%)`, muridId: id, payload: { murid_id: id, jumlah_hari: jh, hadir: h } }
      }
      const e = numOrNull(get(r, 'english'), 0, 100), s = numOrNull(get(r, 'science'), 0, 100), m = numOrNull(get(r, 'mathematics'), 0, 100)
      if (e === 'INVALID' || s === 'INVALID' || m === 'INVALID') return bad('Markah mesti nombor 0–100')
      if (e === null && s === null && m === null) return bad('Tiada markah diisi')
      return { line, label, ok: true, note: `E ${e ?? '–'} · S ${s ?? '–'} · M ${m ?? '–'}`, muridId: id, payload: { murid_id: id, english: e, science: s, mathematics: m } }
    })
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true); setRows(null); setFname(file.name)
    try {
      const raw = await readFile(file)
      if (raw.length < 2) throw new Error('Fail kosong atau tiada baris data.')
      if (raw.length > 501) throw new Error('Maksimum 500 baris sekali import.')
      setRows(build(raw))
    } catch (e) { toast.error('Fail tidak dapat dibaca', { description: (e as Error).message }) }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  async function commit() {
    const good = (rows ?? []).filter((r) => r.ok && r.payload)
    if (!good.length) return toast.warning('Tiada baris sah', { description: 'Betulkan fail dan cuba lagi.' })
    if (mode === 'murid' && !isGuru && !guru) return toast.warning('Pilih guru kelas', { description: 'Murid baharu perlu ditetapkan kepada seorang guru kelas.' })
    setBusy(true)
    const supabase = createClient()
    try {
      const touched: string[] = []
      for (let i = 0; i < good.length; i += 50) {
        const batch = good.slice(i, i + 50)
        if (mode === 'murid') {
          const { data, error } = await supabase.from('murid').insert(batch.map((b) => ({ ...b.payload, guru_kelas_id: isGuru ? userId : guru }))).select('id')
          if (error) throw new Error(error.message)
          ;(data ?? []).forEach((d) => touched.push(d.id))
        } else {
          const { error } = await supabase.from(mode === 'kehadiran' ? 'kehadiran' : 'updlp6').upsert(batch.map((b) => b.payload), { onConflict: 'murid_id' })
          if (error) throw new Error(error.message)
          batch.forEach((b) => b.muridId && touched.push(b.muridId))
        }
      }
      await recomputeStatuses(supabase, touched)
      toast.success('Import selesai', { description: `${good.length} baris berjaya diproses.` })
      setRows(null); router.refresh()
    } catch (e) { toast.error('Import gagal', { description: (e as Error).message }) }
    finally { setBusy(false) }
  }

  const ok = (rows ?? []).filter((r) => r.ok).length, bad = (rows ?? []).length - ok
  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-gradient-to-r from-[#0B1437] via-blue-600 to-violet-600 p-7 text-white shadow-xl"><h1 className="text-2xl font-extrabold tracking-tight">Import Data (Excel / CSV)</h1><p className="mt-1 text-white/80">Muat turun templat, isi dalam Excel, simpan sebagai CSV (atau guna .xlsx), kemudian muat naik. Anda boleh semak pratonton sebelum apa-apa disimpan.</p></section>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(TEMPLATES) as Mode[]).map((k) => (
          <button key={k} onClick={() => { setMode(k); setRows(null) }} className={cn('rounded-2xl border-2 p-4 text-left transition', mode === k ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10' : 'border-transparent bg-white/70 hover:bg-white')}>
            <FileSpreadsheet className={cn('mb-2 h-5 w-5', mode === k ? 'text-blue-600' : 'text-slate-400')} /><div className="text-sm font-extrabold">{TEMPLATES[k].title}</div><div className="mt-1 text-xs text-slate-500">{TEMPLATES[k].desc}</div></button>))}
      </div>
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-base font-extrabold">{t.title}</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-xs text-slate-600">Lajur: <code className="rounded bg-slate-100 px-1.5 py-0.5">{t.head.join(', ')}</code></p>
        {mode === 'murid' && !isGuru && <label className="block max-w-sm"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Tetapkan guru kelas untuk murid yang diimport</span><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={guru} onChange={(e) => setGuru(e.target.value)}><option value="" />{gurus.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}</select></label>}
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={() => downloadCsv(t.file, [t.head, t.sample])}><Download className="mr-2 h-4 w-4" />Muat Turun Templat</Button>
          <input ref={input} type="file" accept=".csv,.xlsx,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button onClick={() => input.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Pilih Fail</Button>
        </div>
        <p className="text-[11px] text-slate-500">No. KP dan telefon dimaskkan di pelayar anda; nombor penuh tidak dihantar atau disimpan.</p>
      </CardContent></Card>
      {rows && (
        <Card className="rounded-3xl border-violet-200"><CardHeader><CardTitle className="flex flex-wrap items-center gap-3 text-base font-extrabold">Pratonton: {fname}
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">{ok} sedia</span>{bad > 0 && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700">{bad} bermasalah</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 divide-y overflow-auto rounded-2xl border">{rows.map((r) => (
              <div key={r.line} className="flex items-center gap-3 px-4 py-2.5 text-sm">{r.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                <span className="w-10 shrink-0 text-xs text-slate-400">#{r.line}</span><span className="min-w-0 flex-1 truncate font-semibold">{r.label}</span><span className={cn('text-xs', r.ok ? 'text-slate-500' : 'text-red-600')}>{r.note}</span></div>))}</div>
            <div className="flex gap-2.5"><Button onClick={commit} disabled={busy || ok === 0}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Import {ok} Baris</Button><Button variant="outline" onClick={() => setRows(null)}>Batal</Button></div>
            {bad > 0 && <p className="text-xs text-slate-500">Baris bermasalah akan dilangkau. Anda boleh betulkan fail dan import semula hanya baris tersebut.</p>}
          </CardContent></Card>
      )}
    </div>
  )
}
