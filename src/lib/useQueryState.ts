import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filter state that lives in the URL, so any filtered view can be linked to
 * directly (`/tasks?project=p1`) and shared or bookmarked.
 *
 * The value is mirrored in local state rather than read straight back out of
 * the URL. Each write is a router navigation, so two keystrokes landing in the
 * same commit would both read the same stale params and the second would
 * overwrite the first — typing "Turning" quickly arrived as "Trning". The
 * mirror updates synchronously, so no keystroke is lost, while the URL stays
 * the canonical, linkable copy.
 */
export function useQueryState(key: string, fallback = 'all'): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams()
  const urlValue = params.get(key) ?? fallback

  const [local, setLocal] = useState(urlValue)

  // Adopt URL changes that did not originate here — back/forward, a deeplink,
  // or another control clearing this param. Comparing against the previous URL
  // value (rather than against `local`) means a URL still catching up to the
  // latest keystroke cannot clobber what has already been typed.
  const [seenUrlValue, setSeenUrlValue] = useState(urlValue)
  if (urlValue !== seenUrlValue) {
    setSeenUrlValue(urlValue)
    setLocal(urlValue)
  }

  const setValue = useCallback(
    (next: string) => {
      setLocal(next)
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

  return [local, setValue]
}
