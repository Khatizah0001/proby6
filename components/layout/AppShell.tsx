'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, Presentation, Printer, Settings, Share2, ShieldCheck, Upload, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/student-utils'

type Role = 'ADMIN' | 'PK1' | 'GURU_KELAS' | 'FEEDER' | 'PPD'
const ALL: Role[] = ['ADMIN', 'PK1', 'GURU_KELAS', 'FEEDER', 'PPD']
const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { href: '/murid', label: 'Profil Murid', icon: Users, roles: ALL },
  { href: '/kohort', label: 'Analisis Kohort', icon: BarChart3, roles: ['ADMIN', 'PK1', 'PPD', 'GURU_KELAS'] as Role[] },
  { href: '/present', label: 'Presentation Mode', icon: Presentation, roles: ALL },
  { href: '/feeder-access', label: 'Feeder Access', icon: Share2, roles: ['ADMIN', 'PK1'] as Role[] },
  { href: '/import', label: 'Import Data', icon: Upload, roles: ['ADMIN', 'PK1', 'GURU_KELAS'] as Role[] },
  { href: '/cetak', label: 'Cetak Pukal', icon: Printer, roles: ['ADMIN', 'PK1', 'GURU_KELAS', 'FEEDER'] as Role[] },
  { href: '/tetapan', label: 'Tetapan', icon: Settings, roles: ALL },
]
const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Pentadbir', PK1: 'PK1 Pentadbiran', GURU_KELAS: 'Guru Kelas', FEEDER: 'Feeder School', PPD: 'PPD' }

export function AppShell({ user, children }: { user: { id: string; nama: string; role: Role }; children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(), [open, setOpen] = useState(false), [busy, setBusy] = useState(false)
  async function logout() {
    setBusy(true)
    const supabase = createClient()
    await supabase.from('audit_log').insert({ user_id: user.id, role: user.role, action: 'LOGOUT' })
    await supabase.auth.signOut()
    toast.info('Anda telah log keluar', { description: 'Jumpa lagi!' })
    router.replace('/login'); router.refresh()
  }
  const title = MENU.find((m) => path === m.href || path.startsWith(m.href + '/'))?.label ?? 'ProBy6'
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print" onClick={() => setOpen(false)} />}
      <aside className={cn('no-print fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-gradient-to-b from-[#0B1437] via-[#0F1A4A] to-[#1A1260] p-4 text-[#cdd6ff] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-6 flex items-center gap-3 px-2 pt-2 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600"><ShieldCheck className="h-5 w-5" /></div>
          <div className="leading-tight"><div className="text-lg font-extrabold">ProBy6</div><div className="text-[10px] opacity-60">SK Nanga Luau · Pilot 2026</div></div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-auto">
          {MENU.map((m) => {
            const allowed = m.roles.includes(user.role), on = path === m.href || path.startsWith(m.href + '/'), Icon = m.icon
            return allowed ? (
              <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-semibold transition', on ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-700/40' : 'text-[#aeb9ee] hover:bg-white/10 hover:text-white')}><Icon className="h-[18px] w-[18px]" />{m.label}</Link>
            ) : (
              <span key={m.href} title="Tiada akses untuk peranan anda" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-semibold opacity-30"><Icon className="h-[18px] w-[18px]" />{m.label}</span>
            )
          })}
        </nav>
        <div className="rounded-2xl bg-white/10 p-3.5 text-[11px] leading-relaxed"><b className="text-white">Menghubungkan Potensi, Memperkasa Transisi Tahun 6</b><br />Dibangunkan oleh: Cikgu Siti Khatizah Safiyuddin, SK Nanga Luau, Julau</div>
      </aside>
      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-7">
          <button className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-1.5 sm:flex">
              <div className="text-right leading-tight"><div className="text-xs font-bold">{user.nama}</div><div className="text-[10px] text-slate-500">{ROLE_LABEL[user.role]}</div></div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-extrabold text-white">{initials(user.nama)}</div>
            </div>
            <Button variant="outline" size="sm" onClick={logout} disabled={busy}><LogOut className="mr-1.5 h-4 w-4" />Keluar</Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7">{children}</main>
      </div>
    </div>
  )
}
