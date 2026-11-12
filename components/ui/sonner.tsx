'use client'
import { Toaster as Sonner } from 'sonner'
/** Toast premium (menggantikan alert native). */
export function Toaster() {
  return <Sonner richColors closeButton position="top-right" toastOptions={{ classNames: { toast: 'rounded-2xl shadow-xl border border-slate-200 font-sans', title: 'font-bold' } }} />
}
