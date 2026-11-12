import { FileText, ShieldCheck, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

const ROLE: Record<string, string> = { ADMIN: 'Pentadbir', PK1: 'PK1 Pentadbiran', GURU_KELAS: 'Guru Kelas', FEEDER: 'Feeder School', PPD: 'PPD' }

export default async function TetapanPage() {
  const user = await getCurrentUser(), supabase = createClient()
  const staff = user.role === 'ADMIN' || user.role === 'PK1'
  const [users, audit] = await Promise.all([
    user.role === 'ADMIN' ? supabase.from('users').select('id,nama,email,role,status').order('role') : Promise.resolve({ data: [] as { id: string; nama: string; email: string; role: string; status: string }[] }),
    staff ? supabase.from('audit_log').select('id,created_at,role,action,details,user:users(nama)').order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] }),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRows = (users.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditRows = (audit.data ?? []) as any[]
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><User className="h-4 w-4 text-violet-600" />Akaun</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">{[['Nama', user.nama], ['E-mel', user.email], ['Peranan', ROLE[user.role]], ['Sekolah', user.sekolah ?? '—']].map(([k, v]) => <div key={k}><div className="text-xs text-slate-500">{k}</div><div className="font-semibold">{v}</div></div>)}</CardContent></Card>
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><ShieldCheck className="h-4 w-4 text-violet-600" />Privasi &amp; Keselamatan</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5 text-sm"><li>No. KP &amp; telefon hanya disimpan dan dipaparkan dalam bentuk masked</li><li>Feeder school: read-only, hanya murid yang dikongsi</li><li>Aktiviti view / print / share / present direkod</li><li>Kebenaran dikuatkuasakan oleh RLS di pangkalan data</li></ul></CardContent></Card>
      </div>
      {user.role === 'ADMIN' && (
        <Card className="rounded-3xl"><CardHeader><CardTitle className="text-[15px] font-extrabold">Pengguna ({userRows.length})</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-2">Nama</th><th>E-mel</th><th>Peranan</th><th>Status</th></tr></thead><tbody>{userRows.map((u) => <tr key={u.id} className="border-t"><td className="py-2.5 font-semibold">{u.nama}</td><td>{u.email}</td><td><span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{u.role}</span></td><td>{u.status}</td></tr>)}</tbody></table></CardContent></Card>
      )}
      {staff && (
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold"><FileText className="h-4 w-4 text-violet-600" />Audit Log Terkini</CardTitle></CardHeader>
          <CardContent>{auditRows.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">Belum ada aktiviti direkod.</div> : auditRows.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 border-b border-dashed py-2.5 text-sm last:border-0"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold">{a.action}</span><span className="font-semibold">{(Array.isArray(a.user) ? a.user[0] : a.user)?.nama ?? '—'}</span><span className="text-xs text-slate-500">{a.role}</span><span className="ml-auto text-xs text-slate-500">{new Date(a.created_at).toLocaleString('ms-MY', { timeZone: 'Asia/Kuching' })}</span></div>))}</CardContent></Card>
      )}
    </div>
  )
}
