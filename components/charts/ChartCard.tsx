'use client'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAL = ['#2F5BFF', '#7C3AED', '#0EC9A5', '#F59E0B', '#EF4444', '#38BDF8', '#A78BFA', '#16A34A', '#FB923C']
const SEM: Record<string, string> = { 'Perlu Intervensi': '#EF4444', Sederhana: '#2F5BFF', Cemerlang: '#0EC9A5', Tinggi: '#EF4444', Rendah: '#16A34A', 'Tiada Data': '#CBD5E1', '<85%': '#EF4444', '85–94%': '#F59E0B', '≥95%': '#16A34A' }

export interface Datum { name: string; value: number }
export function ChartCard({ title, data, type = 'donut', icon }: { title: string; data: Datum[]; type?: 'donut' | 'bar' | 'hbar'; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-3xl shadow-[0_10px_30px_-14px_rgba(30,50,140,.3)]">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-[15px] font-extrabold">{icon}{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-56">
          {data.length === 0 ? <div className="grid h-full place-items-center text-xs text-slate-400">Tiada data</div> : (
            <ResponsiveContainer width="100%" height="100%">
              {type === 'donut' ? (
                <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none">
                  {data.map((d, i) => <Cell key={d.name} fill={SEM[d.name] ?? PAL[i % PAL.length]} />)}</Pie><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
              ) : (
                <BarChart data={data} layout={type === 'hbar' ? 'vertical' : 'horizontal'} margin={{ left: type === 'hbar' ? 18 : 0, right: 8 }}>
                  {type === 'hbar' ? (<><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={80} /></>) : (<><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /></>)}
                  <Tooltip /><Bar dataKey="value" radius={8}>{data.map((d, i) => <Cell key={d.name} fill={SEM[d.name] ?? PAL[i % PAL.length]} />)}</Bar></BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ClassChart({ data }: { data: { name: string; Lengkap: number; Belum: number }[] }) {
  return (
    <Card className="rounded-3xl shadow-[0_10px_30px_-14px_rgba(30,50,140,.3)]">
      <CardHeader className="pb-2"><CardTitle className="text-[15px] font-extrabold">Kelengkapan Profil mengikut Kelas</CardTitle></CardHeader>
      <CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Lengkap" stackId="a" fill="#0EC9A5" radius={[0, 0, 6, 6]} /><Bar dataKey="Belum" stackId="a" fill="#F59E0B" radius={[6, 6, 0, 0]} /></BarChart>
      </ResponsiveContainer></div></CardContent>
    </Card>
  )
}
