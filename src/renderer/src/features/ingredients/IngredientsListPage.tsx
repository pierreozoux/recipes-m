import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge, Center, Group, Loader, Paper, Text, Title } from '@mantine/core'
import { trpc } from '../../api/trpc'
import SearchList from '../../components/SearchList'
import type { IngredientWithPrice } from '@shared/schemas/ingredient'

function formatPrice(ingredient: IngredientWithPrice, t: (key: string) => string): string {
  if (!ingredient.currentPrice) return t('ingredient.noPriceYet')
  const unitLabel = ingredient.unit === 'kg' ? t('ingredient.unitKg') : t('ingredient.unitL')
  return `${ingredient.currentPrice.price.toFixed(2)} ${ingredient.currentPrice.currency} ${unitLabel}`
}

export default function IngredientsListPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listQuery = trpc.ingredients.list.useQuery()
  const utils = trpc.useUtils()
  const createMutation = trpc.ingredients.create.useMutation()

  async function handleCreate(): Promise<void> {
    const created = await createMutation.mutateAsync({ name: t('ingredient.createTitle') })
    await utils.ingredients.list.invalidate()
    navigate(`/ingredients/${created.id}`)
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
      getId={(i) => i.id}
      matches={(item, query) => item.name.toLowerCase().includes(query.toLowerCase())}
      onOpen={(item) => navigate(`/ingredients/${item.id}`)}
      onCreate={handleCreate}
      searchPlaceholder={t('ingredient.searchPlaceholder')}
      emptyMessage={t('common.empty')}
      headerRight={<Title order={4}>{t('ingredient.plural')}</Title>}
      renderRow={(item, selected) => (
        <Paper
          h="100%"
          px="md"
          py="xs"
          radius="sm"
          withBorder={false}
          bg={selected ? 'var(--mantine-color-indigo-light)' : undefined}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Group justify="space-between" w="100%" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Text fz={22} lh={1}>
                {item.icon}
              </Text>
              <Text fw={500}>{item.name}</Text>
            </Group>
            <Badge variant="light" color={item.currentPrice ? 'indigo' : 'gray'}>
              {formatPrice(item, t)}
            </Badge>
          </Group>
        </Paper>
      )}
    />
  )
}
