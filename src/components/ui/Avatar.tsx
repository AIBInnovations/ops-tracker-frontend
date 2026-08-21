import { cn } from '@/lib/cn'

const PALETTE = [
  'bg-[#5852d8] text-white',
  'bg-[#0f9d76] text-white',
  'bg-[#d9822b] text-white',
  'bg-[#c2385c] text-white',
  'bg-[#2f7fd1] text-white',
  'bg-[#7a49c9] text-white',
]

/** Stable colour per identity, so the same entity always reads the same. */
function hueFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const sizeClass = {
  xs: 'h-5 w-5 text-2xs',
  sm: 'h-6 w-6 text-2xs',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
} as const

export function Avatar({
  name,
  size = 'md',
  square = false,
  className,
}: {
  name: string
  size?: keyof typeof sizeClass
  square?: boolean
  className?: string
}) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-tight',
        square ? 'rounded-sm' : 'rounded-full',
        sizeClass[size],
        hueFor(name),
        className,
      )}
    >
      {initialsFor(name)}
    </span>
  )
}
