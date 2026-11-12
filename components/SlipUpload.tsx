'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { recomputeStatuses } from '@/lib/status-client'

/** Muat naik slip UP-DLP6 (gambar atau PDF). Boleh digunakan bersama atau tanpa markah manual. */
export function SlipUpload({ muridId, slipUrl }: { muridId: string; slipUrl?: string | null }) {
  const router = useRouter(), input = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(slipUrl ?? null), [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    const okType = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!okType) return toast.error('Fail tidak sah', { description: 'Sila pilih gambar (JPG/PNG) atau PDF.' })
    if (file.size > 5 * 1024 * 1024) return toast.error('Fail terlalu besar', { description: 'Maksimum 5 MB. Kecilkan gambar atau ambil semula foto slip.' })
    setBusy(true)
    const supabase = createClient()
    try {
      const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${muridId}/slip-${Date.now()}.${ext}`
      const up = await supabase.storage.from('updlp6-slip').upload(path, file, { contentType: file.type, cacheControl: '3600' })
      if (up.error) throw new Error(up.error.message)
      const { data: old } = await supabase.from('updlp6').select('slip_path').eq('murid_id', muridId).maybeSingle()
      const r = await supabase.from('updlp6').upsert({ murid_id: muridId, slip_path: path }, { onConflict: 'murid_id' })
      if (r.error) { await supabase.storage.from('updlp6-slip').remove([path]); throw new Error(r.error.message) }
      if (old?.slip_path) await supabase.storage.from('updlp6-slip').remove([old.slip_path])
      const signed = await supabase.storage.from('updlp6-slip').createSignedUrl(path, 3600)
      setUrl(signed.data?.signedUrl ?? null)
      await recomputeStatuses(supabase, [muridId])
      toast.success('Slip UP-DLP6 disimpan'); router.refresh()
    } catch (e) { toast.error('Gagal memuat naik slip', { description: (e as Error).message }) }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  return (
    <Card className="rounded-3xl border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50">
      <CardContent className="flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><FileText className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><h3 className="font-extrabold">Slip UP-DLP6</h3><p className="text-xs text-slate-600">Muat naik gambar/PDF slip sebagai bukti. Markah masih boleh diisi manual di bawah untuk carta &amp; insight.</p></div>
        <input ref={input} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {url && <Button asChild variant="outline" size="sm"><a href={url} target="_blank" rel="noreferrer"><FileText className="mr-1.5 h-3.5 w-3.5" />Lihat Slip</a></Button>}
        <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}{url ? 'Tukar Slip' : 'Muat Naik Slip'}</Button>
      </CardContent>
    </Card>
  )
}
