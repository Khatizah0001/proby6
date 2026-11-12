/** Kira bilangan bahagian siap daripada baris murid + id bahagian anak (digunakan selepas simpan). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProfileClient(row: any) {
  const has = (x: unknown) => (Array.isArray(x) ? x.length > 0 : !!x)
  const personal = !!(row.nama_murid && row.no_kp_masked && row.alamat && row.penjaga && row.feeder_id)
  const parts = [personal, has(row.akademik), has(row.updlp6), has(row.tiga_m), has(row.psikometrik), has(row.kokurikulum), has(row.kesihatan), has(row.kehadiran), has(row.ssdm)]
  return { siap: parts.filter(Boolean).length, jumlah: parts.length }
}
