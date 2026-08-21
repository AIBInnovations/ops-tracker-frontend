import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filter state that lives in the URL, so any filtered view can be linked to
 * directly (`/tasks?project=p1`) and shared or bookmarked.
 */
export function useQueryState(key: string, fallback = 'all'): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? fallback

  const setValue = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          if (!next || next === fallback) updated.delete(key)
          else updated.set(key, next)
          return updated
        },
        { replace: true },
      )
    },
    [key, fallback, setParams],
  )

  return [value, setValue]
}
