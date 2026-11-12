'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Archive, ArrowLeft, Edit3, Presentation, Printer, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/** Tindakan profil: cetak (direkod dalam audit_log, RLS menyemak can_print), sahkan (PK1/Admin sahaja). */
export function ProfileActions({ muridId, userId, role, canEdit, canPrint, canVerify, complete }: { muridId: string; userId: string; role: string; canEdit: boolean; canPrint: boolean; canVerify: boolean; complete: boolean }) {
  const router = useRouter(), [confirm, setConfirm] = useState(false)
  async function print() {
    const { error } = await createClient().from('audit_log').insert({ user_id: userId, role, action: 'PRINT', murid_id: muridId })
    if (error) return toast.error('Cetakan ditolak', { description: 'Akaun anda tidak dibenarkan mencetak profil ini.' })
    window.print()
  }
  async function verify() {
    if (!complete) return toast.warning('Profil belum lengkap', { description: 'Semua 9 bahagian mesti lengkap sebelum disahkan.' })
    const { error } = await createClient().from('murid').update({ status_profil: 'DISAHKAN', disahkan_oleh: userId, tarikh_sah: new Date().toISOString() }).eq('id', muridId)
    if (error) return toast.error('Gagal mengesahkan', { description: error.message })
    toast.success('Profil disahkan'); router.refresh()
  }
  async function archive() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 5000); return }
    const { error } = await createClient().from('murid').update({ aktif: false }).eq('id', muridId)
    if (error) return toast.error('Gagal mengarkibkan', { description: error.message })
    toast.success('Murid diarkibkan', { description: 'Boleh dipulihkan oleh Admin/PK1 melalui Tetapan.' }); router.push('/murid'); router.refresh()
  }
  return (
    <div className="no-print mb-4 flex flex-wrap gap-2.5">
      <Button asChild variant="outline"><Link href="/murid"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link></Button>
      <Button asChild variant="outline"><Link href={`/present/${muridId}`}><Presentation className="mr-2 h-4 w-4" />Pembentangan</Link></Button>
      {canPrint && <Button variant="outline" onClick={print}><Printer className="mr-2 h-4 w-4" />Cetak Profil</Button>}
      {canEdit && <Button asChild><Link href={`/murid/${muridId}/edit`}><Edit3 className="mr-2 h-4 w-4" />Kemas Kini</Link></Button>}
      {canEdit && <Button variant="outline" onClick={archive} className={confirm ? 'border-red-300 bg-red-50 text-red-700' : ''}><Archive className="mr-2 h-4 w-4" />{confirm ? 'Pasti? Klik sekali lagi' : 'Arkibkan Murid'}</Button>}
      {canVerify && <Button variant="outline" onClick={verify}><ShieldCheck className="mr-2 h-4 w-4" />Sahkan Profil</Button>}
    </div>
  )
}
