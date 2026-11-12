import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updDone } from '@/lib/profile-client'
import type { StudentProfileData } from '@/types/student'

export type Role = 'ADMIN' | 'PK1' | 'GURU_KELAS' | 'FEEDER' | 'PPD'
export interface AppUser { id: string; nama: string; email: string; role: Role; sekolah: string | null; feeder_id: string | null }

export const PROFILE_SELECT =
  '*, feeder:feeder_school!murid_feeder_id_fkey(nama), akademik(*), updlp6(*), tiga_m(*), psikometrik(*), kokurikulum(*), kesihatan(*), kehadiran(*), ssdm(*)'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const one = (x: any) => (Array.isArray(x) ? x[0] ?? null : x ?? null)

/** Tukar baris Supabase (dengan embed) kepada StudentProfileData. Hanya data masked dibawa ke UI. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProfile(row: any): StudentProfileData {
  const { feeder, akademik, updlp6, tiga_m, psikometrik, kokurikulum, kesihatan, kehadiran, ssdm, ...m } = row
  const yr = m.tarikh_lahir ? new Date().getFullYear() - parseInt(String(m.tarikh_lahir).slice(0, 4), 10) : null
  const personal = !!(m.nama_murid && m.no_kp_masked && m.alamat && m.penjaga && m.feeder_id)
  const sections = [personal, !!one(akademik), updDone(updlp6), !!one(tiga_m), !!one(psikometrik), !!one(kokurikulum), !!one(kesihatan), !!one(kehadiran), !!one(ssdm)]
  const kok = one(kokurikulum)
  return {
    murid: { ...m, feeder_nama: one(feeder)?.nama ?? null, umur: yr },
    akademik: one(akademik), updlp6: one(updlp6), tigaM: one(tiga_m), psikometrik: one(psikometrik),
    kokurikulum: kok ? { ...kok, pencapaian: kok.pencapaian ?? [] } : null,
    kesihatan: one(kesihatan), kehadiran: one(kehadiran), ssdm: one(ssdm),
    kelengkapan: { siap: sections.filter(Boolean).length, jumlah: sections.length },
  }
}

/** Gambar & slip disimpan dalam bucket PERIBADI: tukar laluan fail kepada URL bertanda tangan (sah 1 jam). RLS storan menapis mengikut peranan. */
async function attachMedia(list: StudentProfileData[]): Promise<StudentProfileData[]> {
  const supabase = createClient()
  const photoPaths = list.map((p) => p.murid.photo_url).filter((x): x is string => !!x)
  const slipPaths = list.map((p) => p.updlp6?.slip_path).filter((x): x is string => !!x)
  const sign = async (bucket: string, paths: string[]) => {
    const map: Record<string, string> = {}
    if (!paths.length) return map
    const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600)
    ;(data ?? []).forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl })
    return map
  }
  const [ph, sl] = await Promise.all([sign('murid-foto', photoPaths), sign('updlp6-slip', slipPaths)])
  return list.map((p) => ({
    ...p,
    murid: { ...p.murid, photo_url: p.murid.photo_url ? ph[p.murid.photo_url] ?? null : null },
    updlp6: p.updlp6 ? { ...p.updlp6, slip_url: p.updlp6.slip_path ? sl[p.updlp6.slip_path] ?? null : null } : p.updlp6,
  }))
}

/** Pengguna semasa + peranan. Redirect ke /login jika tiada sesi atau akaun tidak aktif. */
export async function getCurrentUser(): Promise<AppUser> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('users').select('id,nama,email,role,sekolah,feeder_id,status').eq('id', user.id).single()
  if (!data || data.status !== 'AKTIF') redirect('/login')
  return data as AppUser
}

/** Semua profil AKTIF yang BOLEH dilihat pengguna — RLS menapis di pangkalan data. */
export async function fetchProfiles(): Promise<StudentProfileData[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('murid').select(PROFILE_SELECT).eq('aktif', true).order('kelas').order('nama_murid')
  if (error) throw new Error(error.message)
  return attachMedia((data ?? []).map(toProfile))
}

export async function fetchProfile(id: string): Promise<StudentProfileData | null> {
  const supabase = createClient()
  const { data } = await supabase.from('murid').select(PROFILE_SELECT).eq('id', id).maybeSingle()
  if (!data) return null
  return (await attachMedia([toProfile(data)]))[0]
}

/** Rekod audit (RLS menyemak pengguna & kebenaran). Kegagalan log tidak mengganggu paparan. */
export async function logAudit(user: AppUser, action: 'VIEW' | 'PRESENT', muridId: string) {
  const supabase = createClient()
  await supabase.from('audit_log').insert({ user_id: user.id, role: user.role, action, murid_id: muridId })
}

export const CAN_EDIT: Role[] = ['ADMIN', 'PK1', 'GURU_KELAS']
export const CAN_SHARE: Role[] = ['ADMIN', 'PK1']
