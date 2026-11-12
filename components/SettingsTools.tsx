'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, KeyRound, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

/** Tukar kata laluan sendiri (wajib selepas akaun ujian/sementara). */
export function ChangePassword() {
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState(''), [busy, setBusy] = useState(false)
  async function save() {
    if (pw.length < 10) return toast.warning('Kata laluan terlalu pendek', { description: 'Gunakan sekurang-kurangnya 10 aksara.' })
    if (pw !== pw2) return toast.warning('Kata laluan tidak sepadan', { description: 'Taip semula kedua-dua ruang dengan sama.' })
    setBusy(true)
    const { error } = await createClient().auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return toast.error('Gagal menukar kata laluan', { description: error.message })
    setPw(''); setPw2(''); toast.success('Kata laluan dikemas kini')
  }
  const cls = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
  return (
    <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><KeyRound className="h-4 w-4 text-violet-600" />Tukar Kata Laluan</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <input className={cls} type="password" placeholder="Kata laluan baharu (min. 10 aksara)" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className={cls} type="password" placeholder="Ulang kata laluan baharu" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Simpan</Button>
      </CardContent></Card>
  )
}

/** Murid diarkibkan (cth. berpindah/tidak lagi dalam kohort). Admin/PK1 boleh memulihkan. */
export function ArchivedList({ items }: { items: { id: string; nama_murid: string; kelas: string }[] }) {
  const router = useRouter(), [busy, setBusy] = useState<string | null>(null)
  async function restore(id: string) {
    setBusy(id)
    const { error } = await createClient().from('murid').update({ aktif: true }).eq('id', id)
    setBusy(null)
    if (error) return toast.error('Gagal memulihkan', { description: error.message })
    toast.success('Murid dipulihkan'); router.refresh()
  }
  return (
    <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><Archive className="h-4 w-4 text-violet-600" />Murid Diarkibkan ({items.length})</CardTitle></CardHeader>
      <CardContent>{items.length === 0 ? <div className="py-6 text-center text-sm text-slate-500">Tiada murid diarkibkan.</div> : items.map((m) => (
        <div key={m.id} className="flex items-center gap-3 border-b border-dashed py-2.5 last:border-0"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{m.nama_murid}</div><div className="text-xs text-slate-500">{m.kelas}</div></div>
          <Button size="sm" variant="outline" onClick={() => restore(m.id)} disabled={busy === m.id}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Pulihkan</Button></div>))}</CardContent></Card>
  )
}
