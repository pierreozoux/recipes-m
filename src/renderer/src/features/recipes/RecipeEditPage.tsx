import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionIcon, Button, Center, Group, Loader, Modal, Paper, Stack, Title, Tooltip, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconArrowLeft, IconTrash } from '@tabler/icons-react'
import { trpc } from '../../api/trpc'
import AutoForm from '../../autoform/AutoForm'
import BlockNoteField from '../../widgets/BlockNoteField'
import RecipeImageField from '../../widgets/RecipeImageField'
import SaveIndicator from '../../components/SaveIndicator'
import ShortcutHint from '../../components/ShortcutHint'
import { useAutosavePatch } from '../../hooks/useAutosavePatch'
import RecipeIngredientsEditor from './RecipeIngredientsEditor'
import { recipeEditableFieldsSchema, type RecipeEditableFields } from '@shared/schemas/recipe'
import type { UiSchema } from '../../autoform/types'

const uiSchema: UiSchema<RecipeEditableFields> = {
  name: { labelKey: 'recipe.name' },
  description: { labelKey: 'recipe.description', widget: BlockNoteField },
  steps: { labelKey: 'recipe.steps', widget: BlockNoteField }
}

export default function RecipeEditPage({ createNew }: { createNew?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const createMutation = trpc.recipes.create.useMutation()
  const createdRef = useRef(false)

  useEffect(() => {
    if (!createNew || createdRef.current) return
    createdRef.current = true
    createMutation.mutateAsync({ name: t('recipe.createTitle') }).then(async (created) => {
      await utils.recipes.list.invalidate()
      navigate(`/recipes/${created.id}`, { replace: true })
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

  return <RecipeEditor key={routeId} id={routeId} />
}

function RecipeEditor({ id }: { id: string }): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const query = trpc.recipes.getById.useQuery({ id })
  const ingredientsQuery = trpc.ingredients.list.useQuery()
  const updateMutation = trpc.recipes.update.useMutation()
  const removeMutation = trpc.recipes.remove.useMutation()

  const [fields, setFields] = useState<RecipeEditableFields | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (query.data) {
      setFields({
        name: query.data.name,
        description: query.data.description,
        steps: query.data.steps
      })
    }
  }, [query.data])

  const { schedule, status } = useAutosavePatch<Partial<RecipeEditableFields>>(async (patch) => {
    await updateMutation.mutateAsync({ id, ...patch })
    await utils.recipes.list.invalidate()
  })

  useHotkeys([['mod+backspace', () => setDeleteOpen(true)]])

  if (!query.data || !fields || ingredientsQuery.isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    )
  }

  async function handleDelete(): Promise<void> {
    await removeMutation.mutateAsync({ id })
    await utils.recipes.list.invalidate()
    navigate('/recipes')
  }

  return (
    <Stack maw={760} pb={60}>
      <Group justify="space-between">
        <Group gap="xs">
          <Tooltip label={t('common.back')}>
            <ActionIcon variant="subtle" onClick={() => navigate('/recipes')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>
          <Title order={3}>{fields.name || t('recipe.createTitle')}</Title>
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
        <Stack gap="lg">
          <AutoForm
            schema={recipeEditableFieldsSchema}
            values={fields}
            uiSchema={uiSchema}
            onFieldChange={(field, value) => {
              setFields((prev) => (prev ? { ...prev, [field]: value } : prev))
              schedule({ [field]: value } as Partial<RecipeEditableFields>)
            }}
          />
          <RecipeImageField
            recipeId={id}
            imagePath={query.data.imagePath}
            onChanged={() => utils.recipes.list.invalidate()}
          />
        </Stack>
      </Paper>

      <Paper p="lg">
        <RecipeIngredientsEditor
          recipeId={id}
          ingredientRows={query.data.ingredients}
          allIngredients={ingredientsQuery.data ?? []}
        />
      </Paper>

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('recipe.deleteConfirmTitle')}>
        <Stack>
          <Text size="sm">{t('recipe.deleteConfirmBody')}</Text>
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
