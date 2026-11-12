export type StatusProfil = 'BELUM_MULA' | 'DALAM_PROSES' | 'PERLU_SEMAKAN' | 'LENGKAP' | 'DISAHKAN' | 'DIKONGSI' | 'DICETAK'
export type Tahap3M = 'MAHIR' | 'SEDERHANA' | 'LEMAH'

export interface Murid {
  id: string; nama_murid: string; no_kp_masked: string; jantina: 'L' | 'P'; umur?: number | null
  kelas: string; sekolah_rendah: string; feeder_id?: string | null; feeder_nama?: string | null; status_asrama?: 'ASRAMA' | 'BUKAN_ASRAMA' | null
  alamat?: string | null; penjaga?: string | null; no_telefon_masked?: string | null; bantuan?: string | null
  masalah_kesihatan?: string | null; photo_url?: string | null; status_profil: StatusProfil
}
export interface Akademik { purata: number | null; tafsiran: string | null }
export interface UpDlp6 { english: number | null; science: number | null; mathematics: number | null; purata: number | null; risiko: 'RENDAH' | 'SEDERHANA' | 'TINGGI' | null }
export interface TigaM { membaca_bm: Tahap3M | null; menulis_bm: Tahap3M | null; reading_bi: Tahap3M | null; writing_bi: Tahap3M | null; mengira: Tahap3M | null; status_keseluruhan: string | null }
export interface Psikometrik { [k: string]: number | string | null | undefined; dominan: string | null }
export interface Kokurikulum { unit_beruniform?: string | null; jawatan_unit?: string | null; kelab_persatuan?: string | null; sukan_permainan?: string | null; pencapaian: string[] }
export interface Kesihatan { tinggi_cm: number | null; berat_kg: number | null; bmi: number | null; status_bmi: string | null; penglihatan?: string | null; pendengaran?: string | null }
export interface Kehadiran { hadir: number; jumlah_hari: number; peratus: number; tafsiran: string }
export interface Ssdm { amalan_baik?: string | null; kes_disiplin: number; risiko: string }

export interface Insight {
  kekuatanUtama: string[]; risikoIntervensi: string[]; cadanganSokongan: string[]
  indeksKesiapsiagaan: number; tahap: string; nota: string
}
export interface StudentProfileData {
  murid: Murid; akademik?: Akademik | null; updlp6?: UpDlp6 | null; tigaM?: TigaM | null; psikometrik?: Psikometrik | null
  kokurikulum?: Kokurikulum | null; kesihatan?: Kesihatan | null; kehadiran?: Kehadiran | null; ssdm?: Ssdm | null
  kelengkapan?: { siap: number; jumlah: number }
}
