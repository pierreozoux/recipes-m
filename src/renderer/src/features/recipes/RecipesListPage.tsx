import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Center, Group, Loader, Paper, Text, ThemeIcon, Title } from '@mantine/core'
import { IconToolsKitchen2 } from '@tabler/icons-react'
import { trpc } from '../../api/trpc'
import SearchList from '../../components/SearchList'

export default function RecipesListPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listQuery = trpc.recipes.list.useQuery()
  const utils = trpc.useUtils()
  const createMutation = trpc.recipes.create.useMutation()

  async function handleCreate(): Promise<void> {
    const created = await createMutation.mutateAsync({ name: t('recipe.createTitle') })
    await utils.recipes.list.invalidate()
    navigate(`/recipes/${created.id}`)
  }

  if (listQuery.isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    )
  }

  return (
    <SearchList
      items={listQuery.data ?? []}
      getId={(r) => r.id}
      matches={(item, query) => item.name.toLowerCase().includes(query.toLowerCase())}
      onOpen={(item) => navigate(`/recipes/${item.id}`)}
      onCreate={handleCreate}
      searchPlaceholder={t('recipe.searchPlaceholder')}
      emptyMessage={t('common.empty')}
      headerRight={<Title order={4}>{t('recipe.plural')}</Title>}
      renderRow={(item, selected) => (
        <Paper
          h="100%"
          px="md"
          py="xs"
          radius="sm"
          bg={selected ? 'var(--mantine-color-indigo-light)' : undefined}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" radius="sm" size={32}>
              <IconToolsKitchen2 size={16} />
            </ThemeIcon>
            <Text fw={500}>{item.name}</Text>
          </Group>
        </Paper>
      )}
    />
  )
}
