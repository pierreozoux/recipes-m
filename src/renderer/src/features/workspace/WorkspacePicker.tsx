import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Center,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
  ThemeIcon,
  Alert
} from '@mantine/core'
import { IconFolderOpen, IconFolderPlus, IconClock, IconAlertCircle, IconChefHat } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../../api/trpc'

export default function WorkspacePicker(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)

  const recentsQuery = trpc.workspace.recents.useQuery()
  const pickFolder = trpc.workspace.pickFolder.useMutation()
  const openWorkspace = trpc.workspace.open.useMutation()

  async function openPath(path: string): Promise<void> {
    setError(null)
    setOpening(true)
    try {
      await openWorkspace.mutateAsync({ path })
      await utils.workspace.current.invalidate()
      navigate('/recipes', { replace: true })
    } catch {
      setError(t('workspace.openError'))
    } finally {
      setOpening(false)
    }
  }

  async function handlePick(mode: 'open' | 'create'): Promise<void> {
    setError(null)
    const path = await pickFolder.mutateAsync({ mode })
    if (!path) return
    await openPath(path)
  }

  const busy = opening || pickFolder.isPending || openWorkspace.isPending

  return (
    <Center mih="100vh" bg="var(--mantine-color-body)">
      <Stack w={520} gap="xl">
        <Stack align="center" gap={4}>
          <ThemeIcon size={56} radius="xl" variant="light">
            <IconChefHat size={30} />
          </ThemeIcon>
          <Title order={2}>{t('workspace.title')}</Title>
          <Text c="dimmed">{t('workspace.subtitle')}</Text>
        </Stack>

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <Group grow>
          <Paper p="lg" radius="md">
            <Stack align="center" gap="xs">
              <ThemeIcon size={40} variant="light" color="indigo">
                <IconFolderOpen size={22} />
              </ThemeIcon>
              <Text fw={600}>{t('workspace.open')}</Text>
              <Text size="sm" c="dimmed" ta="center">
                {t('workspace.openHint')}
              </Text>
              <Button
                fullWidth
                mt="xs"
                loading={busy}
                onClick={() => handlePick('open')}
                data-autofocus
              >
                {t('workspace.open')}
              </Button>
            </Stack>
          </Paper>
          <Paper p="lg" radius="md">
            <Stack align="center" gap="xs">
              <ThemeIcon size={40} variant="light" color="teal">
                <IconFolderPlus size={22} />
              </ThemeIcon>
              <Text fw={600}>{t('workspace.create')}</Text>
              <Text size="sm" c="dimmed" ta="center">
                {t('workspace.createHint')}
              </Text>
              <Button fullWidth mt="xs" variant="light" loading={busy} onClick={() => handlePick('create')}>
                {t('workspace.create')}
              </Button>
            </Stack>
          </Paper>
        </Group>

        <Box>
          <Group gap={6} mb="xs">
            <IconClock size={16} />
            <Text size="sm" fw={600} c="dimmed">
              {t('workspace.recents')}
            </Text>
          </Group>
          {!recentsQuery.data?.length ? (
            <Text size="sm" c="dimmed">
              {t('workspace.noRecents')}
            </Text>
          ) : (
            <Paper radius="md">
              <Stack gap={0}>
                {recentsQuery.data.map((recent) => (
                  <UnstyledButton
                    key={recent.path}
                    px="md"
                    py="xs"
                    disabled={busy}
                    onClick={() => openPath(recent.path)}
                    style={{ borderRadius: 'var(--mantine-radius-md)' }}
                  >
                    <Text fw={500} size="sm">
                      {recent.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {recent.path}
                    </Text>
                  </UnstyledButton>
                ))}
              </Stack>
            </Paper>
          )}
        </Box>
      </Stack>
    </Center>
  )
}
