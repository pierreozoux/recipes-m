// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosavePatch } from './useAutosavePatch'

describe('useAutosavePatch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('merges patches scheduled within the debounce window into a single save call', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosavePatch<{ a: number; b: number }>(save, 400))

    act(() => {
      result.current.schedule({ a: 1 })
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.schedule({ b: 2 })
    })

    expect(save).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ a: 1, b: 2 })
  })

  it('reports saving then saved status', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosavePatch<{ a: number }>(save, 100))

    act(() => result.current.schedule({ a: 1 }))
    expect(result.current.status).toBe('saving')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(result.current.status).toBe('saved')
  })

  it('reports an error status when the save rejects', async () => {
    const save = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAutosavePatch<{ a: number }>(save, 50))

    act(() => result.current.schedule({ a: 1 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })

    expect(result.current.status).toBe('error')
  })

  it('flush() saves immediately and cancels the pending timer', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosavePatch<{ a: number }>(save, 1000))

    act(() => {
      result.current.schedule({ a: 1 })
      result.current.flush()
    })

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ a: 1 })
  })
})
