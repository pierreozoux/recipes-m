import { Modal, Stack, Title, Divider } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { SHORTCUT_GROUPS } from '../shortcuts/registry'
import { ShortcutHintWithLabel } from './ShortcutHint'

interface ShortcutsOverlayProps {
  opened: boolean
  onClose: () => void
}

export default function ShortcutsOverlay({ opened, onClose }: ShortcutsOverlayProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal opened={opened} onClose={onClose} title={t('shortcuts.title')} size="md">
      <Stack gap="lg">
        {SHORTCUT_GROUPS.map((group) => (
          <Stack key={group.titleKey} gap="xs">
            <Title order={6} c="dimmed" tt="uppercase">
              {t(group.titleKey)}
            </Title>
            <Divider mb={2} />
            <Stack gap="xs">
              {group.items.map((item) => (
                <ShortcutHintWithLabel key={item.labelKey} keys={item.keys} label={t(item.labelKey)} />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Modal>
  )
}
