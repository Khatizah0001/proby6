import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/25 hover:brightness-110',
        outline: 'border border-slate-200 bg-white text-[#14204A] hover:border-blue-500 hover:text-blue-600',
        ghost: 'text-slate-600 hover:bg-slate-100',
        destructive: 'bg-red-100 text-red-700 hover:bg-red-200',
      },
      size: { default: 'h-10 px-4 py-2 rounded-xl', sm: 'h-8 px-3 text-xs rounded-lg', lg: 'h-12 px-6 rounded-2xl', icon: 'h-10 w-10 rounded-xl' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'
export { Button, buttonVariants }
