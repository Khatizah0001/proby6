'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { initials } from '@/lib/student-utils'

/** Mampat gambar di pelayar (maks 640px, JPEG) — jimat storan & membuang metadata (cth. lokasi GPS). */
async function compress(file: File, max = 640): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Pelayar tidak menyokong pemprosesan gambar.')
  ctx.drawImage(bmp, 0, 0, w, h)
  return new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses gambar.'))), 'image/jpeg', 0.85))
}

export function PhotoUpload({ muridId, nama, currentUrl }: { muridId: string; nama: string; currentUrl?: string | null }) {
  const router = useRouter(), input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null), [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Fail tidak sah', { description: 'Sila pilih fail gambar (JPG/PNG).' })
    if (file.size > 15 * 1024 * 1024) return toast.error('Gambar terlalu besar', { description: 'Maksimum 15 MB sebelum dimampatkan.' })
    setBusy(true)
    const supabase = createClient()
    try {
      const blob = await compress(file)
      const path = `${muridId}/foto-${Date.now()}.jpg`
      const up = await supabase.storage.from('murid-foto').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600' })
      if (up.error) throw new Error(up.error.message)
      const { data: old } = await supabase.from('murid').select('photo_url').eq('id', muridId).single()
      const upd = await supabase.from('murid').update({ photo_url: path }).eq('id', muridId)
      if (upd.error) { await supabase.storage.from('murid-foto').remove([path]); throw new Error(upd.error.message) }
      if (old?.photo_url) await supabase.storage.from('murid-foto').remove([old.photo_url])
      setPreview(URL.createObjectURL(blob))
      toast.success('Gambar disimpan', { description: nama }); router.refresh()
    } catch (e) { toast.error('Gagal memuat naik gambar', { description: (e as Error).message }) }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  async function remove() {
    setBusy(true)
    const supabase = createClient()
    const { data: old } = await supabase.from('murid').select('photo_url').eq('id', muridId).single()
    const upd = await supabase.from('murid').update({ photo_url: null }).eq('id', muridId)
    if (upd.error) { setBusy(false); return toast.error('Gagal membuang gambar', { description: upd.error.message }) }
    if (old?.photo_url) await supabase.storage.from('murid-foto').remove([old.photo_url])
    setPreview(null); setBusy(false); toast.success('Gambar dibuang'); router.refresh()
  }

  return (
    <Card className="rounded-3xl border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50">
      <CardContent className="flex flex-wrap items-center gap-5 p-5">
        <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[28px] border-[3px] border-white bg-gradient-to-br from-blue-600 to-violet-600 text-3xl font-extrabold text-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt={`Gambar ${nama}`} className="h-full w-full object-cover" /> : initials(nama)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold">Gambar Murid</h3>
          <p className="mt-1 text-xs text-slate-600">Gambar muka yang jelas supaya feeder school dapat mengenali murid. Dimampatkan secara automatik. Disimpan secara peribadi — hanya guru kelas, PK1/Admin dan feeder yang diberi akses boleh melihatnya.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1.5 h-3.5 w-3.5" />}{preview ? 'Tukar Gambar' : 'Muat Naik / Ambil Gambar'}</Button>
            {preview && <Button size="sm" variant="outline" onClick={remove} disabled={busy}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Buang</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
