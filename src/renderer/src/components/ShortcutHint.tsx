import { Group, Kbd, Text } from '@mantine/core'
import { splitAccelerator } from '../shortcuts/format'

interface ShortcutHintProps {
  keys: string
  size?: 'xs' | 'sm'
}

/** Small inline chip that prints a shortcut on top of the action it triggers, e.g. [⌘][N]. */
export default function ShortcutHint({ keys, size = 'xs' }: ShortcutHintProps): JSX.Element {
  const parts = splitAccelerator(keys)
  return (
    <Group gap={2} wrap="nowrap" component="span">
      {parts.map((part, i) => (
        <Kbd key={i} size={size}>
          {part}
        </Kbd>
      ))}
    </Group>
  )
}

export function ShortcutHintWithLabel({ keys, label }: { keys: string; label: string }): JSX.Element {
  return (
    <Group justify="space-between" gap="md" wrap="nowrap">
      <Text size="sm">{label}</Text>
      <ShortcutHint keys={keys} />
    </Group>
  )
}
