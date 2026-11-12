import * as React from 'react'
import { cn } from '@/lib/utils'
function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700', className)} {...props} />
}
export { Badge }
