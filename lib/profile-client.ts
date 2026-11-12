// eslint-disable-next-line @typescript-eslint/no-explicit-any
const first = (x: any) => (Array.isArray(x) ? x[0] ?? null : x ?? null)

/** UP-DLP6 dianggap siap jika ada markah ATAU slip dimuat naik. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updDone(u: any): boolean { const r = first(u); return !!r && (r.purata != null || !!r.slip_path) }

/** Kira bilangan bahagian siap daripada baris murid + bahagian anak. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProfileClient(row: any) {
  const has = (x: unknown) => !!first(x)
  const personal = !!(row.nama_murid && row.no_kp_masked && row.alamat && row.penjaga && row.feeder_id)
  const parts = [personal, has(row.akademik), updDone(row.updlp6), has(row.tiga_m), has(row.psikometrik), has(row.kokurikulum), has(row.kesihatan), has(row.kehadiran), has(row.ssdm)]
  return { siap: parts.filter(Boolean).length, jumlah: parts.length }
}
