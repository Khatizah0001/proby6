import * as React from 'react'
import { cn } from '@/lib/utils'
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...p }, ref) => <div ref={ref} className={cn('rounded-2xl border border-slate-200 bg-white text-[#14204A] shadow-sm', className)} {...p} />)
Card.displayName = 'Card'
const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col space-y-1.5 p-5', className)} {...p} />
const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...p} />
const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-5 pt-0', className)} {...p} />
export { Card, CardHeader, CardTitle, CardContent }
