import Link from 'next/link'
import { Activity, AlertTriangle, BarChart3, BookOpen, Brain, CalendarCheck, CheckCircle2, ClipboardEdit, FileText, Layers, Presentation, Printer, School, Share2, ShieldAlert, Users, type LucideIcon } from 'lucide-react'
import { ChartCard, ClassChart } from '@/components/charts/ChartCard'
import { StudentList, StatusBadge } from '@/components/StudentList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { fetchProfiles, getCurrentUser } from '@/lib/data'
import { computeStats } from '@/lib/stats'
import { riskFlags } from '@/lib/student-utils'

function Kpi({ icon: Icon, tone, value, label }: { icon: LucideIcon; tone: string; value: React.ReactNode; label: string }) {
  return (
    <Card className="relative overflow-hidden rounded-3xl shadow-[0_10px_30px_-14px_rgba(30,50,140,.3)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${tone}`}><Icon className="h-5 w-5" /></div>
        <div><div className="text-3xl font-extrabold leading-none tracking-tight">{value}</div><div className="mt-1 text-xs font-semibold text-slate-500">{label}</div></div>
      </CardContent>
    </Card>
  )
}
const G = { b: 'bg-gradient-to-br from-blue-600 to-blue-400', v: 'bg-gradient-to-br from-violet-600 to-violet-400', t: 'bg-gradient-to-br from-teal-500 to-emerald-400', o: 'bg-gradient-to-br from-amber-500 to-orange-400', r: 'bg-gradient-to-br from-red-500 to-orange-500', g: 'bg-gradient-to-br from-green-600 to-green-400' }

export default async function DashboardPage() {
  const user = await getCurrentUser(), supabase = createClient()
  const list = await fetchProfiles(), s = computeStats(list), r = user.role
  const isStaff = r === 'ADMIN' || r === 'PK1'
  const firstName = user.nama.replace(/^(Pn\.|Cikgu|Encik|En\.)\s+/i, '').split(' ')[0]
  const sub: Record<string, string> = { ADMIN: 'Pusat kawalan sistem ProBy6', PK1: 'Pantau kelengkapan profil sebelum sesi pembentangan', GURU_KELAS: 'Kelengkapan profil murid kelas anda', FEEDER: 'Profil murid yang dikongsi kepada sekolah anda (read-only)', PPD: 'Ringkasan kohort Tahun 6 — akses view-only' }

  let admin: { users: number; feeder: number; print: number } | null = null
  if (r === 'ADMIN') {
    const [u, f, p] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }), supabase.from('feeder_school').select('id', { count: 'exact', head: true }),
      supabase.from('audit_log').select('id', { count: 'exact', head: true }).eq('action', 'PRINT'),
    ])
    admin = { users: u.count ?? 0, feeder: f.count ?? 0, print: p.count ?? 0 }
  }
  let ppdFeeders: { nama: string; sekolah_menengah: string | null; murid: number; dikongsi: number }[] = []
  if (r === 'PPD' || isStaff) {
    const [{ data: fs }, { data: fa }] = await Promise.all([supabase.from('feeder_school').select('id,nama,sekolah_menengah'), supabase.from('feeder_access').select('feeder_id,status')])
    ppdFeeders = (fs ?? []).map((f) => ({ nama: f.nama, sekolah_menengah: f.sekolah_menengah, murid: list.filter((p) => p.murid.feeder_id === f.id).length, dikongsi: (fa ?? []).filter((a) => a.feeder_id === f.id && a.status === 'AKTIF').length }))
  }

  const Action = ({ href, icon: I, children, primary }: { href: string; icon: LucideIcon; children: React.ReactNode; primary?: boolean }) => (
    <Button asChild variant={primary ? 'default' : 'outline'} className={primary ? '' : 'border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-700'}><Link href={href}><I className="mr-2 h-4 w-4" />{children}</Link></Button>
  )

  return (
    <div className="space-y-5">
      <section className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0B1437] via-blue-600 to-violet-600 p-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative"><h1 className="text-2xl font-extrabold tracking-tight">Selamat datang, {firstName} 👋</h1><p className="mt-1 text-white/80">{sub[r]}</p></div>
        <div className="relative ml-auto flex flex-wrap gap-2.5">
          {isStaff && <><Action href="/present" icon={Presentation} primary>Presentation Mode</Action><Action href="/cetak" icon={Printer}>Cetak Pukal</Action><Action href="/feeder-access" icon={Share2}>Kongsi Akses Feeder</Action></>}
          {r === 'ADMIN' && <Action href="/tetapan" icon={FileText}>Audit Log &amp; Pengguna</Action>}
          {r === 'GURU_KELAS' && <Action href="/murid" icon={ClipboardEdit} primary>Isi / Kemas Kini Profil</Action>}
          {(r === 'FEEDER' || r === 'PPD') && <Action href="/present" icon={Presentation} primary>Mod Pembentangan</Action>}
        </div>
      </section>

      {admin && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={Users} tone={G.b} value={admin.users} label="Jumlah Pengguna" /><Kpi icon={School} tone={G.v} value={s.jumlah} label="Jumlah Murid" /><Kpi icon={Share2} tone={G.t} value={admin.feeder} label="Feeder School" /><Kpi icon={FileText} tone={G.o} value={admin.print} label="Laporan Dijana" /></div>}

      {(isStaff || r === 'PPD') && (<>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={Users} tone={G.b} value={s.jumlah} label="Murid Tahun 6" /><Kpi icon={CheckCircle2} tone={G.g} value={s.lengkap} label="Profil Lengkap" />
          <Kpi icon={ClipboardEdit} tone={G.o} value={s.belumLengkap} label="Profil Belum Lengkap" /><Kpi icon={AlertTriangle} tone={G.r} value={s.perluSemakan} label="Perlu Semakan" />
          <Kpi icon={BookOpen} tone={G.v} value={s.intervensi3M} label="Perlu Intervensi 3M" /><Kpi icon={CalendarCheck} tone={G.t} value={`${s.hadirPurata}%`} label="Kehadiran Purata" />
          <Kpi icon={ShieldAlert} tone={G.o} value={s.ssdmAlert} label="SSDM Alerts" /><Kpi icon={Presentation} tone={G.b} value={s.siapBentang} label="Siap Dibentang" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Penguasaan 3M" data={s.charts.tigaM} icon={<BookOpen className="h-4 w-4 text-violet-600" />} />
          <ChartCard title="Risiko UP-DLP6" data={s.charts.upd} icon={<Activity className="h-4 w-4 text-violet-600" />} />
          <ChartCard title="Psikometrik Dominan" data={s.charts.psiko} type="hbar" icon={<Brain className="h-4 w-4 text-violet-600" />} />
          <ChartCard title="Kehadiran" data={s.charts.hadir} type="bar" icon={<CalendarCheck className="h-4 w-4 text-violet-600" />} />
          <ChartCard title="Taburan Feeder School" data={s.charts.feeder} icon={<School className="h-4 w-4 text-violet-600" />} />
          <ChartCard title="Status Profil" data={s.charts.status} type="bar" icon={<Layers className="h-4 w-4 text-violet-600" />} />
        </div>
      </>)}

      {r === 'PPD' && (
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><BarChart3 className="h-4 w-4 text-violet-600" />Sekolah Feeder &amp; Status Pembentangan ({ppdFeeders.length} sekolah)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">{ppdFeeders.map((f) => (
            <div key={f.nama} className="rounded-2xl border border-slate-200 p-4"><div className="font-bold">{f.nama}</div><div className="mb-3 text-xs text-slate-500">{f.murid} murid sasaran</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600" style={{ width: `${f.murid ? Math.min(100, (f.dikongsi / f.murid) * 100) : 0}%` }} /></div>
              <div className="mt-2 text-xs text-slate-500">Akses aktif: {f.dikongsi}</div></div>))}</CardContent></Card>
      )}

      {(isStaff || r === 'GURU_KELAS') && (
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><AlertTriangle className="h-4 w-4 text-amber-500" />{r === 'GURU_KELAS' ? 'Murid Belum Lengkap / Perlu Perhatian' : 'Murid Perlu Perhatian'}</CardTitle></CardHeader>
          <CardContent>{s.perhatian.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">Semua baik — tiada murid memerlukan perhatian.</div> : s.perhatian.map((p) => (
            <div key={p.murid.id} className="flex flex-wrap items-center gap-3 border-b border-dashed border-slate-200 py-3 last:border-0">
              <div className="min-w-0 flex-1"><div className="text-sm font-bold">{p.murid.nama_murid}</div><div className="text-xs text-slate-500">{p.murid.kelas} · {p.kelengkapan!.siap}/{p.kelengkapan!.jumlah} bahagian</div></div>
              {riskFlags(p).map((f) => <span key={f} className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">{f}</span>)}<StatusBadge s={p.murid.status_profil} />
              <Button asChild variant="outline" size="sm"><Link href={`/murid/${p.murid.id}`}>Lihat</Link></Button></div>))}</CardContent></Card>
      )}

      {r === 'GURU_KELAS' && (<div className="grid gap-4 lg:grid-cols-3"><Kpi icon={Users} tone={G.b} value={s.jumlah} label="Murid Kelas Saya" /><Kpi icon={CheckCircle2} tone={G.g} value={s.lengkap} label="Profil Lengkap" /><Kpi icon={CalendarCheck} tone={G.t} value={`${s.hadirPurata}%`} label="Kehadiran Kelas" />
        <ChartCard title="Ringkasan 3M Kelas" data={s.charts.tigaM} icon={<BookOpen className="h-4 w-4 text-violet-600" />} /><div className="lg:col-span-2"><ClassChart data={s.charts.kelas} /></div></div>)}

      {(r === 'GURU_KELAS' || r === 'FEEDER') && (<section><h3 className="mb-3 text-lg font-extrabold">{r === 'FEEDER' ? 'Murid Dikongsi' : 'Senarai Murid Kelas'}</h3><StudentList items={list} canEdit={r === 'GURU_KELAS'} showClassFilter={false} /></section>)}
    </div>
  )
}
