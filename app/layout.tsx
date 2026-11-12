import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
export const metadata: Metadata = {
  title: 'ProBy6 — Profiling & Bridging for Year 6',
  description: 'Menghubungkan Potensi, Memperkasa Transisi Tahun 6 — Dibangunkan oleh Cikgu Siti Khatizah Safiyuddin, SK Nanga Luau, Julau',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms"><body className={`${jakarta.variable} font-sans antialiased`}>{children}<Toaster /></body></html>
  )
}
