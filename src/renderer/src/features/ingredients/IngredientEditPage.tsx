import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ActionIcon,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react'
import { trpc } from '../../api/trpc'
import AutoForm from '../../autoform/AutoForm'
import EmojiField from '../../widgets/EmojiField'
import SaveIndicator from '../../components/SaveIndicator'
import ShortcutHint from '../../components/ShortcutHint'
import { useAutosavePatch } from '../../hooks/useAutosavePatch'
import {
  ingredientEditableFieldsSchema,
  type IngredientEditableFields
} from '@shared/schemas/ingredient'
import type { UiSchema } from '../../autoform/types'

const uiSchema: UiSchema<IngredientEditableFields> = {
  name: { labelKey: 'ingredient.name' },
  unit: { labelKey: 'ingredient.unit' },
  icon: { labelKey: 'ingredient.icon', widget: EmojiField }
}

export default function IngredientEditPage({ createNew }: { createNew?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const createMutation = trpc.ingredients.create.useMutation()
  const createdRef = useRef(false)

  useEffect(() => {
    if (!createNew || createdRef.current) return
    createdRef.current = true
    createMutation.mutateAsync({ name: t('ingredient.createTitle') }).then(async (created) => {
      await utils.ingredients.list.invalidate()
      navigate(`/ingredients/${created.id}`, { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createNew])

  if (createNew || !routeId) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    )
  }

  return <IngredientEditor key={routeId} id={routeId} />
}

function IngredientEditor({ id }: { id: string }): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const query = trpc.ingredients.getById.useQuery({ id })
  const updateMutation = trpc.ingredients.update.useMutation()
  const addPriceMutation = trpc.ingredients.addPrice.useMutation()
  const historyQuery = trpc.ingredients.listPriceHistory.useQuery({ ingredientId: id })
  const removeMutation = trpc.ingredients.remove.useMutation()

  const [fields, setFields] = useState<IngredientEditableFields | null>(null)
  const [newPrice, setNewPrice] = useState<number | ''>('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (query.data) {
      setFields({ name: query.data.name, unit: query.data.unit, icon: query.data.icon })
    }
  }, [query.data])

  const { schedule, status } = useAutosavePatch<Partial<IngredientEditableFields>>(async (patch) => {
    await updateMutation.mutateAsync({ id, ...patch })
    await utils.ingredients.list.invalidate()
  })

  useHotkeys([['mod+backspace', () => setDeleteOpen(true)]])

  if (!query.data || !fields) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    )
  }

  async function handleAddPrice(): Promise<void> {
    if (newPrice === '' || newPrice < 0) return
    await addPriceMutation.mutateAsync({ ingredientId: id, price: newPrice, currency: 'EUR' })
    setNewPrice('')
    await Promise.all([
      utils.ingredients.getById.invalidate({ id }),
      utils.ingredients.listPriceHistory.invalidate({ ingredientId: id }),
      utils.ingredients.list.invalidate()
    ])
  }

  async function handleDelete(): Promise<void> {
    await removeMutation.mutateAsync({ id })
    await utils.ingredients.list.invalidate()
    navigate('/ingredients')
  }

  return (
    <Stack maw={640}>
      <Group justify="space-between">
        <Group gap="xs">
          <Tooltip label={t('common.back')}>
            <ActionIcon variant="subtle" onClick={() => navigate('/ingredients')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>
          <Title order={3}>{fields.name || t('ingredient.createTitle')}</Title>
        </Group>
        <Group gap="md">
          <SaveIndicator status={status} />
          <Tooltip label={<ShortcutHint keys="mod+backspace" />}>
            <ActionIcon color="red" variant="subtle" onClick={() => setDeleteOpen(true)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Paper p="lg">
        <AutoForm
          schema={ingredientEditableFieldsSchema}
          values={fields}
          uiSchema={uiSchema}
          onFieldChange={(field, value) => {
            setFields((prev) => (prev ? { ...prev, [field]: value } : prev))
            schedule({ [field]: value } as Partial<IngredientEditableFields>)
          }}
        />
      </Paper>

      <Paper p="lg">
        <Stack gap="sm">
          <Title order={5}>{t('ingredient.priceHistory')}</Title>
          <Group align="flex-end">
            <NumberInput
              label={t('ingredient.newPricePlaceholder')}
              placeholder="0.00"
              decimalScale={2}
              min={0}
              value={newPrice}
              onChange={(v) => setNewPrice(typeof v === 'number' ? v : '')}
              w={160}
            />
            <ActionIcon
              size="lg"
              variant="filled"
              onClick={handleAddPrice}
              disabled={newPrice === ''}
              aria-label={t('ingredient.addPrice')}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
          <Divider />
          {!historyQuery.data?.length ? (
            <Text c="dimmed" size="sm">
              {t('ingredient.noPriceYet')}
            </Text>
          ) : (
            <Stack gap={6}>
              {historyQuery.data.map((price) => (
                <Group key={price.id} justify="space-between">
                  <Text size="sm">
                    {price.price.toFixed(2)} {price.currency}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(price.createdAt).toLocaleString()}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('ingredient.deleteConfirmTitle')}>
        <Stack>
          <Text size="sm">{t('ingredient.deleteConfirmBody')}</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
