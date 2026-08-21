import { cn } from '@/lib/cn'

export function Divider({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <hr
      className={cn('m-0 border-0 bg-line', vertical ? 'h-full w-px' : 'h-px w-full', className)}
    />
  )
}
