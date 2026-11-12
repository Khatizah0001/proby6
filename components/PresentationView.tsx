'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Home, Printer, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StudentProfileCard } from '@/components/StudentProfileCard'
import { createClient } from '@/lib/supabase/client'
import type { StudentProfileData } from '@/types/student'

/** Presentation Mode: penuh lebar, navigasi prev/next (butang + kekunci anak panah), animasi Framer Motion. */
export function PresentationView({ user, data, prevId, nextId, position, total, options, canPrint }: { user: { id: string; role: string }; data: StudentProfileData; prevId: string | null; nextId: string | null; position: number; total: number; options: { id: string; nama: string }[]; canPrint: boolean }) {
  const router = useRouter(), id = data.murid.id
  const go = (to: string | null) => to && router.push(`/present/${to}`)

  useEffect(() => { createClient().from('audit_log').insert({ user_id: user.id, role: user.role, action: 'PRESENT', murid_id: id }).then(() => undefined) }, [id, user.id, user.role])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === 'SELECT') return; if (e.key === 'ArrowRight') go(nextId); if (e.key === 'ArrowLeft') go(prevId); if (e.key === 'Escape') router.push('/dashboard') }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
  async function print() {
    const { error } = await createClient().from('audit_log').insert({ user_id: user.id, role: user.role, action: 'PRINT', murid_id: id })
    if (error) return toast.error('Cetakan ditolak', { description: 'Akaun anda tidak dibenarkan mencetak profil ini.' })
    window.print()
  }
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#2a2f9a,#0B1437_55%,#190c4f)] p-5 text-white sm:p-8">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600"><ShieldCheck className="h-4 w-4" /></div><div className="leading-tight"><b>ProBy6</b><div className="text-[10px] text-white/60">Presentation Mode</div></div></div>
        <select value={id} onChange={(e) => go(e.target.value)} aria-label="Pilih murid" className="h-10 max-w-[260px] rounded-xl border border-white/25 bg-white/10 px-3 text-sm text-white outline-none">{options.map((o) => <option key={o.id} value={o.id} className="text-black">{o.nama}</option>)}</select>
        <Button variant="outline" onClick={() => go(prevId)} disabled={!prevId} className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-700"><ChevronLeft className="mr-1 h-4 w-4" />Sebelum</Button>
        <span className="text-sm font-bold">{position} / {total}</span>
        <Button onClick={() => go(nextId)} disabled={!nextId}>Seterusnya<ChevronRight className="ml-1 h-4 w-4" /></Button>
        {canPrint && <Button variant="outline" onClick={print} className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-700"><Printer className="mr-2 h-4 w-4" />Cetak Profil</Button>}
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-700"><Home className="mr-2 h-4 w-4" />Kembali ke Dashboard</Button>
      </div>
      <AnimatePresence mode="wait"><motion.div key={id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
        <StudentProfileCard data={data} readOnly={user.role === 'FEEDER' || user.role === 'PPD'} />
      </motion.div></AnimatePresence>
    </div>
  )
}
