import type { Insight, StudentProfileData, Tahap3M } from '@/types/student'

const TM: Record<Tahap3M, number> = { MAHIR: 100, SEDERHANA: 70, LEMAH: 30 }
const DOM: Record<string, { label: string; tip: string }> = {
  visual_ruang: { label: 'Visual-Ruang', tip: 'Gunakan peta minda, grafik & bahan visual' },
  logik_matematik: { label: 'Logik-Matematik', tip: 'Beri cabaran penyelesaian masalah & pola' },
  kinestatik: { label: 'Kinestetik', tip: 'Libatkan pembelajaran hands-on & projek' },
  verbal_linguistik: { label: 'Verbal-Linguistik', tip: 'Galakkan pidato & penulisan kreatif' },
  muzik: { label: 'Muzik', tip: 'Integrasikan irama dalam hafalan' },
  interpersonal: { label: 'Interpersonal', tip: 'Beri peranan kepimpinan & kerja berkumpulan' },
  naturalis: { label: 'Naturalis', tip: 'Projek sains lapangan & alam sekitar' },
  intrapersonal: { label: 'Intrapersonal', tip: 'Beri ruang refleksi & matlamat peribadi' },
  existential: { label: 'Existential', tip: 'Libatkan perbincangan bernilai & projek komuniti' },
}

/** Rule-based "AI-Assisted Insight" (tiada API AI). Mudah ditukar kepada panggilan LLM pada fasa 2. */
export function computeInsight(p: StudentProfileData): Insight {
  const kekuatan: string[] = [], risiko: string[] = [], cadangan: string[] = [], skor: [number, number][] = []
  const avg = p.akademik?.purata ?? null
  if (avg != null) {
    skor.push([avg, 0.3])
    if (avg >= 75) kekuatan.push(`Pencapaian akademik kukuh (purata ${avg}%)`)
    else if (avg < 50) { risiko.push(`Pencapaian akademik rendah (purata ${avg}%)`); cadangan.push('Program pemulihan/pengayaan akademik awal') }
  }
  const up = p.updlp6
  if (up?.purata != null) {
    if (up.purata < 50) { risiko.push(`UP-DLP6 rendah (${up.purata}%)`); cadangan.push('Bimbingan English, Sains & Matematik secara kumpulan kecil') }
    else if (up.purata >= 75) kekuatan.push(`UP-DLP6 cemerlang (${up.purata}%)`)
  }
  const t = p.tigaM
  if (t) {
    const lit = [t.membaca_bm, t.menulis_bm, t.reading_bi, t.writing_bi], all = [...lit, t.mengira].filter(Boolean) as Tahap3M[]
    if (all.length) skor.push([all.reduce((s, x) => s + TM[x], 0) / all.length, 0.25])
    if (lit.includes('LEMAH')) { risiko.push('Penguasaan literasi 3M lemah'); cadangan.push('Intervensi literasi: bacaan berpandu & penulisan terarah') }
    if (t.mengira === 'LEMAH') { risiko.push('Penguasaan numerasi (mengira) lemah'); cadangan.push('Intervensi numerasi: aktiviti konkrit & latih tubi asas') }
    if (all.length === 5 && all.every((x) => x === 'MAHIR')) kekuatan.push('Penguasaan 3M mantap')
  }
  const h = p.kehadiran?.peratus ?? null
  if (h != null) {
    skor.push([h, 0.2])
    if (h < 85) { risiko.push(`Risiko kehadiran (${h}%)`); cadangan.push('Pemantauan kehadiran bersama penjaga pada awal Tingkatan 1') }
    else if (h >= 95) kekuatan.push(`Kehadiran cemerlang (${h}%)`)
  }
  const kes = p.ssdm?.kes_disiplin ?? 0
  if (p.ssdm) {
    skor.push([Math.max(0, 100 - 25 * kes), 0.1])
    if (kes > 0) { risiko.push(`Catatan sahsiah: ${kes} kes disiplin`); cadangan.push('Rujuk guru bimbingan & mentor rakan sebaya') }
    else if (p.ssdm.amalan_baik) kekuatan.push(`Sahsiah baik: ${p.ssdm.amalan_baik}`)
  }
  const dom = p.psikometrik?.dominan
  if (dom && DOM[dom]) { kekuatan.push(`Kecenderungan dominan: ${DOM[dom].label}`); cadangan.push(DOM[dom].tip) }
  if (p.kokurikulum?.pencapaian?.length) kekuatan.push(`Penglibatan kokurikulum aktif (${p.kokurikulum.pencapaian[0]})`)
  if (p.kelengkapan) skor.push([(p.kelengkapan.siap / p.kelengkapan.jumlah) * 100, 0.15])

  const tw = skor.reduce((s, x) => s + x[1], 0)
  const idx = tw ? Math.round(skor.reduce((s, x) => s + x[0] * x[1], 0) / tw) : 0
  const tahap = idx >= 80 ? 'Sangat Bersedia' : idx >= 65 ? 'Bersedia' : idx >= 50 ? 'Perlu Sokongan Sederhana' : 'Perlu Sokongan Intensif'
  return {
    kekuatanUtama: kekuatan.length ? kekuatan : ['Data belum mencukupi — lengkapkan profil'],
    risikoIntervensi: risiko.length ? risiko : ['Tiada risiko ketara dikesan'],
    cadanganSokongan: cadangan.length ? cadangan : ['Pemantauan berkala & penyertaan aktif di sekolah menengah'],
    indeksKesiapsiagaan: idx, tahap,
    nota: 'Rumusan ini dijana berdasarkan data profil murid dan perlu disemak oleh pihak sekolah.',
  }
}
