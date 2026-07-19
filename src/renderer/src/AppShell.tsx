import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppShell as MantineAppShell,
  Group,
  Stack,
  Text,
  ThemeIcon,
  SegmentedControl,
  ActionIcon,
  Tooltip,
  UnstyledButton,
  NavLink as MantineNavLink
} from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight'
import {
  IconChefHat,
  IconToolsKitchen2,
  IconCarrot,
  IconFolderSymlink,
  IconKeyboard,
  IconSearch
} from '@tabler/icons-react'
import ShortcutsOverlayModal from './components/ShortcutsOverlay'
import { trpc } from './api/trpc'
import type { SupportedLocale } from './i18n'

export default function AppShell(): JSX.Element {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const utils = trpc.useUtils()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    const offChangeFolder = window.electron.ipcRenderer.on('app:change-folder', () => {
      utils.workspace.current.invalidate()
      navigate('/', { replace: true })
    })
    const offShortcuts = window.electron.ipcRenderer.on('app:show-shortcuts', () => {
      setShortcutsOpen(true)
    })
    return () => {
      offChangeFolder()
      offShortcuts()
    }
  }, [navigate, utils])

  useHotkeys([
    ['mod+1', () => navigate('/recipes')],
    ['mod+2', () => navigate('/ingredients')],
    ['shift+/', () => setShortcutsOpen(true)]
  ])

  const actions: SpotlightActionData[] = [
    {
      id: 'go-recipes',
      label: t('nav.recipes'),
      leftSection: <IconToolsKitchen2 size={18} />,
      onClick: () => navigate('/recipes')
    },
    {
      id: 'go-ingredients',
      label: t('nav.ingredients'),
      leftSection: <IconCarrot size={18} />,
      onClick: () => navigate('/ingredients')
    },
    {
      id: 'new-recipe',
      label: t('recipe.createTitle'),
      leftSection: <IconToolsKitchen2 size={18} />,
      onClick: () => navigate('/recipes/new')
    },
    {
      id: 'new-ingredient',
      label: t('ingredient.createTitle'),
      leftSection: <IconCarrot size={18} />,
      onClick: () => navigate('/ingredients/new')
    },
    {
      id: 'shortcuts',
      label: t('shortcuts.title'),
      leftSection: <IconKeyboard size={18} />,
      onClick: () => setShortcutsOpen(true)
    }
  ]

  return (
    <MantineAppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <MantineAppShell.Navbar p="md">
        <Stack h="100%" justify="space-between">
          <Stack gap="lg">
            <Group gap="xs">
              <ThemeIcon variant="light" radius="xl">
                <IconChefHat size={18} />
              </ThemeIcon>
              <Text fw={700}>{t('app.name')}</Text>
            </Group>

            <Stack gap={4}>
              <MantineNavLink
                component={Link}
                to="/recipes"
                label={t('nav.recipes')}
                leftSection={<IconToolsKitchen2 size={18} />}
                active={location.pathname.startsWith('/recipes')}
                variant="light"
              />
              <MantineNavLink
                component={Link}
                to="/ingredients"
                label={t('nav.ingredients')}
                leftSection={<IconCarrot size={18} />}
                active={location.pathname.startsWith('/ingredients')}
                variant="light"
              />
            </Stack>
          </Stack>

          <Stack gap="sm">
            <UnstyledButton onClick={() => spotlight.open()}>
              <Group gap="xs" c="dimmed">
                <IconSearch size={16} />
                <Text size="sm">{t('nav.commandPalette')}</Text>
              </Group>
            </UnstyledButton>

            <SegmentedControl
              size="xs"
              value={i18n.resolvedLanguage}
              onChange={(value) => i18n.changeLanguage(value as SupportedLocale)}
              data={[
                { label: 'EN', value: 'en' },
                { label: 'FR', value: 'fr' }
              ]}
            />

            <Group gap="xs" justify="space-between">
              <Tooltip label={t('workspace.changeFolder')}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    utils.workspace.current.invalidate()
                    navigate('/', { replace: true })
                  }}
                >
                  <IconFolderSymlink size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('shortcuts.title')}>
                <ActionIcon variant="subtle" color="gray" onClick={() => setShortcutsOpen(true)}>
                  <IconKeyboard size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>
        </Stack>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>

      <Spotlight actions={actions} shortcut="mod+k" nothingFound="…" />
      <ShortcutsOverlayModal opened={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </MantineAppShell>
  )
}
