import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEFAULT_DELAY_MS = 400

/**
 * Debounced, background "save-as-you-type" for a single entity. Callers
 * update local state immediately (so the UI never blocks) and call
 * `schedule(partialPatch)`; patches made within the debounce window are
 * merged into one request. A hard crash can lose the last in-flight patch —
 * that tradeoff is intentional in exchange for never blocking typing.
 */
export function useAutosavePatch<TPatch extends object>(
  save: (patch: TPatch) => Promise<unknown>,
  delayMs = DEFAULT_DELAY_MS
): { schedule: (patch: Partial<TPatch>) => void; status: SaveStatus; flush: () => void } {
  const pending = useRef<Partial<TPatch>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const saveRef = useRef(save)
  saveRef.current = save

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (Object.keys(pending.current).length === 0) return
    const patch = pending.current
    pending.current = {}
    setStatus('saving')
    saveRef
      .current(patch as TPatch)
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'))
  }, [])

  const schedule = useCallback(
    (patch: Partial<TPatch>) => {
      pending.current = { ...pending.current, ...patch }
      setStatus('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delayMs)
    },
    [flush, delayMs]
  )

  // Flush on unmount so navigating away doesn't drop a pending edit; this
  // only helps for in-app navigation, not a hard crash (see above).
  useEffect(() => () => flush(), [flush])

  return { schedule, status, flush }
}
