import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ActionIcon, Box, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import ShortcutHint from './ShortcutHint'

const ROW_HEIGHT = 60

interface SearchListProps<T> {
  items: T[]
  getId: (item: T) => string
  matches: (item: T, query: string) => boolean
  renderRow: (item: T, selected: boolean) => React.ReactNode
  onOpen: (item: T) => void
  onCreate?: () => void
  searchPlaceholder: string
  emptyMessage: string
  headerRight?: React.ReactNode
}

/**
 * Keyboard-driven list used by both the Recipes and Ingredients screens:
 * search is focused by default, typing filters live, the first result is
 * auto-selected, arrow keys move the selection, and Enter opens it.
 */
export default function SearchList<T>({
  items,
  getId,
  matches,
  renderRow,
  onOpen,
  onCreate,
  searchPlaceholder,
  emptyMessage,
  headerRight
}: SearchListProps<T>): JSX.Element {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return items
    return items.filter((item) => matches(item, trimmed))
  }, [items, query, matches])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, items.length])

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8
  })

  useEffect(() => {
    virtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
  }, [selectedIndex, virtualizer])

  useHotkeys([['mod+f', () => searchRef.current?.focus()]])
  useEffect(() => {
    if (onCreate) {
      const handler = (e: KeyboardEvent): void => {
        const isMod = e.metaKey || e.ctrlKey
        if (isMod && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          onCreate()
        }
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
    return undefined
  }, [onCreate])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[selectedIndex]
      if (item) onOpen(item)
    }
  }

  return (
    <Stack gap="md" h="100%">
      <Group justify="space-between" align="center">
        <TextInput
          ref={searchRef}
          data-autofocus
          autoFocus
          leftSection={<IconSearch size={16} />}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={handleSearchKeyDown}
          w={360}
        />
        <Group gap="xs">
          {headerRight}
          {onCreate && (
            <Tooltip label={<ShortcutHint keys="mod+n" />}>
              <ActionIcon variant="filled" size="lg" onClick={onCreate} aria-label={t('common.new')}>
                <IconPlus size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">
          {emptyMessage}
        </Text>
      ) : (
        <Box ref={parentRef} style={{ flex: 1, overflow: 'auto' }}>
          <Box style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = filtered[virtualRow.index]
              return (
                <Box
                  key={getId(item)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    height: virtualRow.size
                  }}
                  onClick={() => setSelectedIndex(virtualRow.index)}
                  onDoubleClick={() => onOpen(item)}
                >
                  {renderRow(item, virtualRow.index === selectedIndex)}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </Stack>
  )
}
