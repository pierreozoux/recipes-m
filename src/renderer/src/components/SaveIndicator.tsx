import { Group, Loader, Text } from '@mantine/core'
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { SaveStatus } from '../hooks/useAutosavePatch'

export default function SaveIndicator({ status }: { status: SaveStatus }): JSX.Element | null {
  const { t } = useTranslation()

  if (status === 'idle') return null

  return (
    <Group gap={6}>
      {status === 'saving' && (
        <>
          <Loader size={12} />
          <Text size="xs" c="dimmed">
            {t('common.saving')}
          </Text>
        </>
      )}
      {status === 'saved' && (
        <>
          <IconCheck size={14} color="var(--mantine-color-teal-6)" />
          <Text size="xs" c="dimmed">
            {t('common.saved')}
          </Text>
        </>
      )}
      {status === 'error' && (
        <>
          <IconExclamationCircle size={14} color="var(--mantine-color-red-6)" />
          <Text size="xs" c="red">
            {t('common.unknownError')}
          </Text>
        </>
      )}
    </Group>
  )
}
