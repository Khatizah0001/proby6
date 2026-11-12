'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { AlertTriangle, Activity, FileText, BookOpenCheck, CalendarCheck, Edit3, HeartPulse, Home, Presentation, Printer, ShieldAlert, Sparkles, Trophy, User, Brain, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { computeInsight } from '@/lib/insight'
import { initials, maskIC, maskPhone, STATUS_STYLE } from '@/lib/student-utils'
import type { Insight, StudentProfileData, Tahap3M } from '@/types/student'

interface Props {
  data: StudentProfileData
  insight?: Insight                // jika tiada, dikira (rule-based) daripada data
  canEdit?: boolean                // Guru Kelas/PK1/Admin; FALSE untuk Feeder & PPD (read-only)
  canPrint?: boolean               // Feeder: mengikut feeder_access.can_print
  dark?: boolean                   // varian Presentation Mode
  readOnly?: boolean               // papar lencana 'read-only' (Feeder/PPD)
  onEdit?: () => void; onPrint?: () => void; onPresent?: () => void
}

const DOM_KEYS = ['verbal_linguistik', 'visual_ruang', 'logik_matematik', 'muzik', 'naturalis', 'kinestatik', 'interpersonal', 'intrapersonal', 'existential']
const label = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const TM_STYLE: Record<Tahap3M, string> = { MAHIR: 'bg-emerald-100 text-emerald-800', SEDERHANA: 'bg-amber-100 text-amber-800', LEMAH: 'bg-red-100 text-red-800' }

function Section({ icon: Icon, title, children, className, dark }: { icon: LucideIcon; title: string; children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <Card className={cn('rounded-3xl border shadow-[0_10px_30px_-14px_rgba(30,50,140,.3)]', dark ? 'border-white/15 bg-white/10 text-white backdrop-blur-xl' : 'border-slate-200/70 bg-white', className)}>
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><Icon className={cn('h-4 w-4', dark ? 'text-teal-300' : 'text-violet-600')} />{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
const KV = ({ k, v, dark }: { k: string; v?: React.ReactNode; dark?: boolean }) => (
  <div className="min-w-0"><div className={cn('text-[11px]', dark ? 'text-white/60' : 'text-slate-500')}>{k}</div><div className="truncate text-[13px] font-semibold" title={typeof v === 'string' ? v : undefined}>{v || '—'}</div></div>
)
function Meter({ label: l, value, tone = 'blue', dark }: { label: string; value?: number | null; tone?: 'blue' | 'teal' | 'risk'; dark?: boolean }) {
  const v = value ?? 0
  const bg = tone === 'risk' ? 'from-amber-400 to-red-500' : tone === 'teal' ? 'from-teal-400 to-emerald-500' : 'from-blue-500 to-violet-600'
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-xs font-semibold"><span>{l}</span><span>{value == null ? '—' : `${v}%`}</span></div>
      <div className={cn('h-2 overflow-hidden rounded-full', dark ? 'bg-white/15' : 'bg-slate-100')}>
        <motion.div className={cn('h-full rounded-full bg-gradient-to-r', bg)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, v)}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>
    </div>
  )
}
function ReadinessRing({ value }: { value: number }) {
  const r = 46, c = 2 * Math.PI * r
  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Indeks kesiapsiagaan ${value} daripada 100`}>
      <svg viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="9" />
        <motion.circle cx="55" cy="55" r={r} fill="none" stroke="url(#rg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * value) / 100 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5EEAD4" /><stop offset="1" stopColor="#A78BFA" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-3xl font-extrabold leading-none">{value}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-white/70">Kesiapsiagaan</div></div></div>
    </div>
  )
}

export function StudentProfileCard({ data, insight, canEdit, canPrint, dark, readOnly, onEdit, onPrint, onPresent }: Props) {
  const { murid: m, akademik, updlp6, tigaM, psikometrik, kokurikulum, kesihatan, kehadiran, ssdm, kelengkapan } = data
  const ins = insight ?? computeInsight(data)
  const st = STATUS_STYLE[m.status_profil]
  const risks = [
    tigaM?.status_keseluruhan === 'PERLU_INTERVENSI' && '3M', kehadiran && kehadiran.peratus < 85 && 'Kehadiran',
    updlp6?.risiko === 'TINGGI' && 'UP-DLP6', ssdm && ssdm.kes_disiplin > 0 && 'SSDM',
  ].filter(Boolean) as string[]
  const pct = kelengkapan ? Math.round((kelengkapan.siap / kelengkapan.jumlah) * 100) : null
  const D = !!dark

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B1437] via-blue-600 to-violet-600 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[30px] border-[3px] border-white/50 bg-white/20 shadow-lg">
            {m.photo_url ? <Image src={m.photo_url} alt={`Gambar ${m.nama_murid}`} fill sizes="112px" unoptimized className="object-cover" />
              : <div className="grid h-full w-full place-items-center text-4xl font-extrabold">{initials(m.nama_murid)}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1', st.cls)}><span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />{st.label}</span>
              {m.status_asrama && <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">{m.status_asrama === 'ASRAMA' ? 'Asrama' : 'Bukan Asrama'}</Badge>}
              {risks.map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold"><AlertTriangle className="h-3 w-3" />{r}</span>)}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{m.nama_murid}</h1>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3 xl:grid-cols-6">
              {([['Sekolah Rendah', m.sekolah_rendah], ['Feeder Sasaran', m.feeder_nama], ['Kelas', m.kelas], ['Jantina', m.jantina === 'L' ? 'Lelaki' : 'Perempuan'], ['Umur', m.umur ? `${m.umur} tahun` : '—'], ['No. KP', maskIC(m.no_kp_masked)]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-white/70">{k}</dt><dd className="text-sm font-bold">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>
          <ReadinessRing value={ins.indeksKesiapsiagaan} />
        </div>
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2">
          {onPresent && <Button onClick={onPresent} className="rounded-xl bg-white text-blue-700 hover:bg-white/90"><Presentation className="mr-2 h-4 w-4" />Pembentangan</Button>}
          {canPrint && onPrint && <Button variant="outline" onClick={onPrint} className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white hover:text-blue-700"><Printer className="mr-2 h-4 w-4" />Cetak Profil</Button>}
          {canEdit && onEdit && <Button onClick={onEdit} className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 font-bold text-white hover:brightness-110"><Edit3 className="mr-2 h-4 w-4" />Kemas Kini</Button>}
          {readOnly && <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold"><ShieldAlert className="h-3.5 w-3.5" />Paparan read-only</span>}
          {pct !== null && <span className="ml-auto text-xs text-white/80">Kelengkapan {kelengkapan!.siap}/{kelengkapan!.jumlah} ({pct}%)</span>}
        </div>
      </div>

      {/* ===== GRID KAD ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section dark={D} icon={User} title="Maklumat Peribadi">
          <div className="grid grid-cols-2 gap-3">
            <KV dark={D} k="Penjaga" v={m.penjaga} /><KV dark={D} k="No. Telefon" v={maskPhone(m.no_telefon_masked)} />
            <KV dark={D} k="Bantuan" v={m.bantuan} /><KV dark={D} k="Kesihatan" v={m.masalah_kesihatan} />
            <div className="col-span-2"><KV dark={D} k="Alamat" v={m.alamat} /></div>
          </div>
        </Section>
        <Section dark={D} icon={Trophy} title="Pencapaian & Kokurikulum">
          {kokurikulum ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><KV dark={D} k="Unit Beruniform" v={[kokurikulum.unit_beruniform, kokurikulum.jawatan_unit].filter(Boolean).join(' · ')} /><KV dark={D} k="Sukan" v={kokurikulum.sukan_permainan} /></div>
              <div className="flex flex-wrap gap-2">{kokurikulum.pencapaian.length ? kokurikulum.pencapaian.map((p) => <Badge key={p} className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100"><Trophy className="mr-1 h-3 w-3" />{p}</Badge>) : <span className="text-xs text-slate-400">Tiada pencapaian direkod</span>}</div>
            </div>) : <Empty />}
        </Section>
        <Section dark={D} icon={HeartPulse} title="Kesihatan">
          {kesihatan ? (
            <div className="grid grid-cols-2 gap-3">
              <KV dark={D} k="Tinggi / Berat" v={`${kesihatan.tinggi_cm ?? '—'} cm / ${kesihatan.berat_kg ?? '—'} kg`} /><KV dark={D} k="BMI" v={kesihatan.bmi ? `${kesihatan.bmi} (${kesihatan.status_bmi})` : null} />
              <KV dark={D} k="Penglihatan" v={kesihatan.penglihatan} /><KV dark={D} k="Pendengaran" v={kesihatan.pendengaran} />
            </div>) : <Empty />}
        </Section>

        <Section dark={D} icon={BookOpenCheck} title="Penguasaan 3M">
          {tigaM ? (
            <div className="grid grid-cols-5 gap-2 text-center">
              {([['BM Baca', tigaM.membaca_bm], ['BM Tulis', tigaM.menulis_bm], ['BI Read', tigaM.reading_bi], ['BI Write', tigaM.writing_bi], ['Mengira', tigaM.mengira]] as const).map(([k, v]) => (
                <div key={k} className={cn('rounded-2xl px-1 py-2.5 text-[10.5px] font-semibold', v ? TM_STYLE[v] : 'bg-slate-100 text-slate-500')}>{k}<div className="mt-1 text-[11px] font-extrabold">{v ?? '—'}</div></div>
              ))}
            </div>) : <Empty />}
        </Section>
        <Section dark={D} icon={Activity} title="Akademik / UP-DLP6">
          {akademik || updlp6 ? (<>
            <Meter dark={D} label={`Purata Akademik${akademik?.tafsiran ? ` (${label(akademik.tafsiran)})` : ''}`} value={akademik?.purata} />
            <Meter dark={D} label="English" value={updlp6?.english} /><Meter dark={D} label="Science" value={updlp6?.science} /><Meter dark={D} label="Mathematics" value={updlp6?.mathematics} />
            {updlp6?.slip_url && <a href={updlp6.slip_url} target="_blank" rel="noreferrer" className="mb-2 mr-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-200"><FileText className="h-3.5 w-3.5" />Lihat Slip UP-DLP6</a>}
            {updlp6?.risiko && <Badge className={cn('mt-1 rounded-full', updlp6.risiko === 'TINGGI' ? 'bg-red-100 text-red-700' : updlp6.risiko === 'SEDERHANA' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>Risiko UP-DLP6: {label(updlp6.risiko)}</Badge>}
          </>) : <Empty />}
        </Section>
        <Section dark={D} icon={CalendarCheck} title="Kehadiran & SSDM">
          {kehadiran && <Meter dark={D} label={`Kehadiran (${label(kehadiran.tafsiran)})`} value={kehadiran.peratus} tone={kehadiran.peratus < 85 ? 'risk' : 'teal'} />}
          {ssdm && <div className="mt-3 grid grid-cols-2 gap-3"><KV dark={D} k="Kes Disiplin" v={String(ssdm.kes_disiplin)} /><KV dark={D} k="Risiko SSDM" v={label(ssdm.risiko)} /><div className="col-span-2"><KV dark={D} k="Amalan Baik" v={ssdm.amalan_baik} /></div></div>}
          {!kehadiran && !ssdm && <Empty />}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section dark={D} icon={Brain} title="Psikometrik (Kecerdasan Pelbagai)">
          {psikometrik ? DOM_KEYS.map((k) => <Meter key={k} dark={D} label={label(k)} value={psikometrik[k] as number | null} tone={psikometrik.dominan === k ? 'teal' : 'blue'} />) : <Empty />}
        </Section>

        {/* ===== AI-ASSISTED INSIGHT ===== */}
        <Card className="rounded-3xl border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 shadow-[0_10px_30px_-14px_rgba(124,58,237,.35)]">
          <CardHeader className="pb-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-[11px] font-extrabold text-white"><Sparkles className="h-3.5 w-3.5" />AI-Assisted Insight</span>
          </CardHeader>
          <CardContent className="space-y-4 text-[#14204A]">
            <InsightList title="1. Kekuatan Utama" tone="text-emerald-700" items={ins.kekuatanUtama} />
            <InsightList title="2. Risiko / Keperluan Intervensi" tone="text-amber-700" items={ins.risikoIntervensi} />
            <InsightList title="3. Cadangan Sokongan Awal" tone="text-blue-700" items={ins.cadanganSokongan} />
            <div className="flex items-center gap-2 rounded-2xl bg-violet-100/70 px-4 py-3 text-sm font-extrabold text-violet-800"><Home className="h-4 w-4" />4. Indeks Kesiapsiagaan: {ins.indeksKesiapsiagaan}/100 — {ins.tahap}</div>
            <p className="text-[11px] italic text-slate-500">{ins.nota}</p>
          </CardContent>
        </Card>
      </div>
    </motion.article>
  )
}

const Empty = () => <div className="rounded-2xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">Bahagian ini belum diisi</div>
function InsightList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (<div><div className={cn('mb-1 text-[13px] font-extrabold', tone)}>{title}</div><ul className="list-disc space-y-0.5 pl-5 text-[13px] leading-relaxed">{items.map((i) => <li key={i}>{i}</li>)}</ul></div>)
}
export default StudentProfileCard
