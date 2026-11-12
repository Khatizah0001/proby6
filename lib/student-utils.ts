import type { StatusProfil } from '@/types/student'

/** Pertahanan berlapis: walaupun DB hanya simpan nilai masked, UI memastikan tiada IC/telefon penuh dipaparkan. */
export function maskIC(v?: string | null) {
  if (!v) return '—'
  if (v.includes('*')) return v
  const d = v.replace(/\D/g, '')
  return d.length >= 12 ? `${d.slice(0, 6)}-**-***${d.slice(-1)}` : '******-**-****'
}
export function maskPhone(v?: string | null) {
  if (!v) return '—'
  if (v.includes('*')) return v
  const d = v.replace(/\D/g, '')
  return d.length >= 7 ? `${d.slice(0, 3)}-***${d.slice(-4)}` : '***-*******'
}

/** merah: belum mula | oren: dalam proses/perlu semakan | hijau: lengkap/disahkan | biru: dikongsi | violet: dicetak */
export const STATUS_STYLE: Record<StatusProfil, { label: string; cls: string; dot: string }> = {
  BELUM_MULA:    { label: 'Belum Mula',    cls: 'bg-red-100 text-red-700 ring-red-200',          dot: 'bg-red-500' },
  DALAM_PROSES:  { label: 'Dalam Proses',  cls: 'bg-amber-100 text-amber-700 ring-amber-200',    dot: 'bg-amber-500' },
  PERLU_SEMAKAN: { label: 'Perlu Semakan', cls: 'bg-orange-100 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  LENGKAP:       { label: 'Lengkap',       cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  DISAHKAN:      { label: 'Disahkan',      cls: 'bg-teal-100 text-teal-700 ring-teal-200',       dot: 'bg-teal-500' },
  DIKONGSI:      { label: 'Dikongsi',      cls: 'bg-blue-100 text-blue-700 ring-blue-200',       dot: 'bg-blue-500' },
  DICETAK:       { label: 'Dicetak',       cls: 'bg-violet-100 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
}
export const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()

import type { StudentProfileData } from '@/types/student'

/** Bendera risiko ringkas (digunakan dashboard, senarai & kartu). */
export function riskFlags(p: StudentProfileData): string[] {
  const r: string[] = []
  if (p.tigaM?.status_keseluruhan === 'PERLU_INTERVENSI') r.push('3M')
  if (p.kehadiran && p.kehadiran.peratus < 85) r.push('Kehadiran')
  if (p.updlp6?.risiko === 'TINGGI') r.push('UP-DLP6')
  if (p.ssdm && p.ssdm.kes_disiplin > 0) r.push('SSDM')
  return r
}
export const DONE: string[] = ['LENGKAP', 'DISAHKAN', 'DIKONGSI', 'DICETAK']

/** Status profil daripada bilangan bahagian siap. Status pengesahan sedia ada tidak diturunkan. */
export function computeStatus(siap: number, jumlah: number, current?: string): StatusProfil {
  if (siap === 0) return 'BELUM_MULA'
  if (siap < 7) return 'DALAM_PROSES'
  if (siap < jumlah) return 'PERLU_SEMAKAN'
  if (current === 'DISAHKAN' || current === 'DIKONGSI' || current === 'DICETAK') return current
  return 'LENGKAP'
}
