'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, School, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { cn } from '@/lib/utils'

type Mode = 'ADMIN' | 'GURU_KELAS' | 'FEEDER' | 'PPD'

/** Konfigurasi hero & teks setiap mod — identiti ProBy6 kekal, aksen berubah mengikut peranan. */
const MODES: Record<Mode, {
  label: string; icon: LucideIcon; title: string; sub: string; cta: string; headline: [string, string]; blurb: string
  glow: [string, string]; features: string[]; stats: [string, string][]; bars: number[]; roles: string[]
}> = {
  ADMIN: { label: 'Admin', icon: ShieldCheck, title: 'Log Masuk Admin', sub: 'Urus sistem, pengguna & kelengkapan profil.', cta: 'Masuk sebagai Admin',
    headline: ['Urus Profil Transisi', 'dengan Kawalan Penuh'], blurb: 'Pusat kawalan untuk PK1 dan pentadbir sistem ProBy6.',
    glow: ['#2F5BFF', '#7C3AED'], features: ['Pemantauan kelengkapan', 'Presentation Mode', 'Cetak pukal', 'Audit log aktiviti'],
    stats: [['9', 'Bahagian profil'], ['RLS', 'Data dilindungi'], ['100%', 'Dijejak']], bars: [40, 62, 50, 80, 66, 92], roles: ['ADMIN', 'PK1'] },
  GURU_KELAS: { label: 'Guru Kelas', icon: BookOpen, title: 'Log Masuk Guru Kelas', sub: 'Isi & kemas kini profil murid kelas anda.', cta: 'Masuk sebagai Guru Kelas',
    headline: ['Isi Profil Murid', 'Lebih Pantas & Tepat'], blurb: 'Tiada lagi salin-tampal slaid. Satu borang, satu pangkalan data.',
    glow: ['#0EC9A5', '#2F5BFF'], features: ['Borang berstruktur', 'Status kelengkapan', 'BMI & purata automatik', 'Insight automatik'],
    stats: [['Auto', 'Pengiraan'], ['Zod', 'Validasi'], ['1', 'Kelas anda']], bars: [55, 70, 45, 88, 60, 75], roles: ['GURU_KELAS'] },
  FEEDER: { label: 'Feeder School', icon: School, title: 'Log Masuk Feeder School', sub: 'Lihat profil murid yang dikongsi kepada sekolah anda.', cta: 'Masuk sebagai Feeder School',
    headline: ['Kenali Murid Baharu', 'Sebelum Mereka Tiba'], blurb: 'Akses terkawal, read-only, dengan rumusan sokongan awal.',
    glow: ['#7C3AED', '#0EC9A5'], features: ['Profil dikongsi sahaja', 'Read-only selamat', 'Rumusan AI-Assisted', 'Cetak jika dibenarkan'],
    stats: [['RO', 'Akses'], ['AI', 'Insight'], ['PDF', 'Cetak']], bars: [35, 48, 66, 52, 78, 70], roles: ['FEEDER'] },
  PPD: { label: 'PPD', icon: BarChart3, title: 'Log Masuk PPD', sub: 'Pantau kohort & status pembentangan peringkat daerah.', cta: 'Masuk sebagai PPD',
    headline: ['Analisis Kohort', 'Peringkat Daerah'], blurb: 'Gambaran menyeluruh sekolah feeder dan kesiapsiagaan transisi.',
    glow: ['#2F5BFF', '#0EC9A5'], features: ['Ringkasan kohort', 'Analisis daerah', 'Status pembentangan', 'Akses view-only'],
    stats: [['3', 'Feeder'], ['View', 'Akses'], ['5 thn', 'Rekod']], bars: [70, 52, 84, 60, 95, 78], roles: ['PPD'] },
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('ADMIN')
  const [show, setShow] = useState(false)
  const m = MODES[mode]
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginInput) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword(values)
    if (error || !data.user) {
      return toast.error('Log masuk gagal', { description: 'E-mel atau kata laluan tidak sah.' })
    }
    // Sahkan peranan sebenar (daripada jadual users, dilindungi RLS) sepadan dengan mod yang dipilih.
    const { data: profile } = await supabase.from('users').select('role,status,nama').eq('id', data.user.id).single()
    if (!profile || profile.status !== 'AKTIF') {
      await supabase.auth.signOut()
      return toast.error('Akaun tidak aktif', { description: 'Sila hubungi pentadbir sistem.' })
    }
    if (!m.roles.includes(profile.role)) {
      await supabase.auth.signOut()
      return toast.warning('Mod peranan tidak sepadan', { description: `Akaun ini bukan untuk mod "${m.label}". Pilih peranan yang betul.` })
    }
    await supabase.from('audit_log').insert({ user_id: data.user.id, role: profile.role, action: 'LOGIN' })
    toast.success(`Selamat datang, ${profile.nama.split(' ')[0]}`, { description: 'Mengalihkan ke dashboard…' })
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#0B1437] lg:grid-cols-[1.15fr_1fr]">
      {/* ================= HERO (kiri) ================= */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
        <AnimatePresence mode="wait">
          <motion.div key={mode} className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <div className="absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full opacity-60 blur-[90px]" style={{ background: m.glow[0] }} />
            <div className="absolute -bottom-32 -left-24 h-[24rem] w-[24rem] rounded-full opacity-50 blur-[90px]" style={{ background: m.glow[1] }} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.06)_1px,transparent_0)] [background-size:28px_28px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-700/40"><ShieldCheck className="h-6 w-6" /></div>
          <div className="leading-tight"><div className="text-2xl font-extrabold tracking-tight">ProBy6</div><div className="text-xs text-white/60">Profiling &amp; Bridging for Year 6</div></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} className="relative z-10 max-w-xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
              {m.headline[0]}<br /><span className="bg-gradient-to-r from-sky-300 via-violet-300 to-teal-300 bg-clip-text text-transparent">{m.headline[1]}</span>
            </h1>
            <p className="mt-4 text-lg text-white/80">{m.blurb}</p>

            <div className="mt-8 rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {m.stats.map(([v, l]) => (
                  <div key={l} className="rounded-2xl bg-white/10 px-4 py-3"><div className="text-2xl font-bold">{v}</div><div className="text-[11px] text-white/70">{l}</div></div>
                ))}
              </div>
              <div className="flex h-20 items-end gap-2">
                {m.bars.map((b, i) => (
                  <motion.div key={i} className="flex-1 rounded-t-lg" style={{ background: `linear-gradient(180deg, ${m.glow[0]}, ${m.glow[1]})` }}
                    initial={{ height: 0 }} animate={{ height: `${b}%` }} transition={{ delay: 0.1 + i * 0.07, duration: 0.7, ease: 'easeOut' }} />
                ))}
              </div>
            </div>
            <ul className="mt-6 grid max-w-md grid-cols-2 gap-3 text-sm">
              {m.features.map((f) => (<li key={f} className="flex items-center gap-2 text-white/90"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300" />{f}</li>))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <p className="relative z-10 text-xs text-white/70">Dibangunkan oleh: Cikgu Siti Khatizah Safiyuddin, SK Nanga Luau, Julau</p>
      </section>

      {/* ================= KAD LOGIN (kanan) ================= */}
      <section className="relative flex items-center justify-center bg-[radial-gradient(circle_at_80%_8%,#dfe6ff,#f3f6ff_60%)] px-5 py-10 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[460px] rounded-[28px] border border-white bg-white/80 p-7 shadow-[0_30px_70px_-30px_rgba(30,50,160,.5)] backdrop-blur-2xl sm:p-9">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white"><ShieldCheck className="h-5 w-5" /></div>
            <div className="font-extrabold text-[#14204A]">ProBy6</div>
          </div>

          {/* Pemilih peranan */}
          <div role="tablist" aria-label="Pilih peranan" className="mb-7 grid grid-cols-4 gap-2">
            {(Object.keys(MODES) as Mode[]).map((k) => {
              const Icon = MODES[k].icon, on = k === mode
              return (
                <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setMode(k)}
                  className={cn('relative flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] px-1 py-3 text-[11px] font-semibold transition',
                    on ? 'border-blue-500 bg-white text-blue-600 shadow-lg shadow-blue-500/20' : 'border-transparent bg-slate-100 text-slate-500 hover:-translate-y-0.5 hover:text-blue-600')}>
                  <Icon className="h-5 w-5" />{MODES[k].label}
                  {on && <motion.span layoutId="roleDot" className="absolute -bottom-1 h-1 w-6 rounded-full bg-gradient-to-r from-blue-500 to-violet-600" />}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              <h2 className="text-[26px] font-extrabold tracking-tight text-[#14204A]">{m.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{m.sub}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-500">E-mel</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" type="email" autoComplete="username" placeholder="nama@sekolah.my" aria-invalid={!!errors.email}
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-10 focus-visible:ring-blue-500/30" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-500">Kata Laluan</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password}
                  className="h-12 rounded-2xl border-slate-200 bg-white px-10 focus-visible:ring-blue-500/30" {...register('password')} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyi kata laluan' : 'Tunjuk kata laluan'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-[15px] font-bold shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:brightness-110">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memeriksa…</> : <>{m.cta}<ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11.5px] leading-relaxed text-slate-500">
            Menghubungkan Potensi, Memperkasa Transisi Tahun 6<br />Dibangunkan oleh: Cikgu Siti Khatizah Safiyuddin, SK Nanga Luau, Julau
          </p>
        </motion.div>
      </section>
    </main>
  )
}
