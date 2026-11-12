import { BookOpen, CalendarCheck, School } from 'lucide-react'
import { ChartCard, ClassChart } from '@/components/charts/ChartCard'
import { fetchProfiles, getCurrentUser } from '@/lib/data'
import { computeStats } from '@/lib/stats'

export default async function KohortPage() {
  await getCurrentUser()
  const s = computeStats(await fetchProfiles())
  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-gradient-to-r from-[#0B1437] via-blue-600 to-violet-600 p-7 text-white shadow-xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Analisis Kohort Tahun 6</h1>
        <p className="mt-1 text-white/80">{s.jumlah} murid · Purata akademik <b>{s.akademikPurata}%</b> · Kehadiran purata <b>{s.hadirPurata}%</b> · Intervensi 3M <b>{s.intervensi3M}</b></p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2"><ClassChart data={s.charts.kelas} /><ChartCard title="Kehadiran Purata mengikut Kelas (%)" data={s.charts.kelas.map((k) => ({ name: k.name, value: k.Hadir }))} type="bar" icon={<CalendarCheck className="h-4 w-4 text-violet-600" />} /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Penguasaan 3M" data={s.charts.tigaM} icon={<BookOpen className="h-4 w-4 text-violet-600" />} />
        <ChartCard title="Taburan Feeder School" data={s.charts.feeder} icon={<School className="h-4 w-4 text-violet-600" />} />
        <ChartCard title="Psikometrik Dominan" data={s.charts.psiko} type="hbar" />
      </div>
    </div>
  )
}
