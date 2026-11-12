import type { StudentProfileData } from '@/types/student'
import { DONE, riskFlags } from '@/lib/student-utils'

const avg = (a: (number | null | undefined)[]) => { const v = a.filter((x): x is number => typeof x === 'number'); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : 0 }
const count = (items: string[]) => { const m: Record<string, number> = {}; items.forEach((i) => { m[i] = (m[i] || 0) + 1 }); return Object.entries(m).map(([name, value]) => ({ name, value })) }
const DOM: Record<string, string> = { verbal_linguistik: 'Verbal', visual_ruang: 'Visual', logik_matematik: 'Logik', muzik: 'Muzik', naturalis: 'Naturalis', kinestatik: 'Kinestetik', interpersonal: 'Interpersonal', intrapersonal: 'Intrapersonal', existential: 'Existential' }
const TM_LABEL: Record<string, string> = { PERLU_INTERVENSI: 'Perlu Intervensi', SEDERHANA: 'Sederhana', CEMERLANG: 'Cemerlang' }
const ST_LABEL: Record<string, string> = { BELUM_MULA: 'Belum Mula', DALAM_PROSES: 'Dalam Proses', PERLU_SEMAKAN: 'Perlu Semakan', LENGKAP: 'Lengkap', DISAHKAN: 'Disahkan', DIKONGSI: 'Dikongsi', DICETAK: 'Dicetak' }

export function computeStats(list: StudentProfileData[]) {
  const lengkap = list.filter((p) => DONE.includes(p.murid.status_profil)).length
  const kelas: Record<string, { jumlah: number; lengkap: number; hadir: number[] }> = {}
  list.forEach((p) => {
    const k = (kelas[p.murid.kelas] ||= { jumlah: 0, lengkap: 0, hadir: [] })
    k.jumlah++; if (DONE.includes(p.murid.status_profil)) k.lengkap++; if (p.kehadiran) k.hadir.push(p.kehadiran.peratus)
  })
  return {
    jumlah: list.length, lengkap, belumLengkap: list.length - lengkap,
    perluSemakan: list.filter((p) => p.murid.status_profil === 'PERLU_SEMAKAN').length,
    intervensi3M: list.filter((p) => p.tigaM?.status_keseluruhan === 'PERLU_INTERVENSI').length,
    hadirPurata: avg(list.map((p) => p.kehadiran?.peratus)), akademikPurata: avg(list.map((p) => p.akademik?.purata)),
    ssdmAlert: list.filter((p) => (p.ssdm?.kes_disiplin ?? 0) > 0).length,
    siapBentang: list.filter((p) => ['DIKONGSI', 'DICETAK'].includes(p.murid.status_profil)).length,
    charts: {
      tigaM: count(list.filter((p) => p.tigaM).map((p) => TM_LABEL[p.tigaM!.status_keseluruhan ?? ''] ?? 'Tiada')),
      upd: count(list.map((p) => (p.updlp6?.risiko ? p.updlp6.risiko[0] + p.updlp6.risiko.slice(1).toLowerCase() : 'Tiada Data'))),
      psiko: count(list.filter((p) => p.psikometrik?.dominan).map((p) => DOM[p.psikometrik!.dominan!] ?? p.psikometrik!.dominan!)),
      hadir: count(list.filter((p) => p.kehadiran).map((p) => (p.kehadiran!.peratus >= 95 ? '≥95%' : p.kehadiran!.peratus >= 85 ? '85–94%' : '<85%'))),
      feeder: count(list.map((p) => p.murid.feeder_nama ?? 'Belum ditetapkan')),
      status: count(list.map((p) => ST_LABEL[p.murid.status_profil])),
      kelas: Object.entries(kelas).map(([name, k]) => ({ name, Lengkap: k.lengkap, Belum: k.jumlah - k.lengkap, Hadir: avg(k.hadir) })),
    },
    perhatian: list.filter((p) => riskFlags(p).length || !DONE.includes(p.murid.status_profil)).sort((a, b) => riskFlags(b).length - riskFlags(a).length).slice(0, 8),
  }
}
export type Stats = ReturnType<typeof computeStats>
