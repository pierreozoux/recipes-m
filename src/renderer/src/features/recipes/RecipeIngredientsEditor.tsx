import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Title } from '@mantine/core'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { trpc } from '../../api/trpc'
import RecipeIngredientRow from './RecipeIngredientRow'
import NewIngredientRow from './NewIngredientRow'
import type { IngredientWithPrice } from '@shared/schemas/ingredient'
import type { RecipeIngredient } from '@shared/schemas/recipe'

interface RecipeIngredientsEditorProps {
  recipeId: string
  ingredientRows: RecipeIngredient[]
  allIngredients: IngredientWithPrice[]
}

export default function RecipeIngredientsEditor({
  recipeId,
  ingredientRows,
  allIngredients
}: RecipeIngredientsEditorProps): JSX.Element {
  const { t } = useTranslation()
  const utils = trpc.useUtils()
  const addMutation = trpc.recipes.addIngredient.useMutation()
  const reorderMutation = trpc.recipes.reorderIngredients.useMutation()

  const [rows, setRows] = useState(ingredientRows)
  useEffect(() => setRows(ingredientRows), [ingredientRows])

  const ingredientsById = new Map(allIngredients.map((i) => [i.id, i]))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function handleCommit(ingredientId: string, quantityPerPerson: number): Promise<void> {
    await addMutation.mutateAsync({ recipeId, ingredientId, quantityPerPerson })
    await utils.recipes.getById.invalidate({ id: recipeId })
  }

  function handleRemoved(id: string): void {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function handleQuantityChange(id: string, quantity: number): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantityPerPerson: quantity } : r)))
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    const next = arrayMove(rows, oldIndex, newIndex)
    setRows(next)
    await reorderMutation.mutateAsync({ recipeId, orderedIds: next.map((r) => r.id) })
    await utils.recipes.getById.invalidate({ id: recipeId })
  }

  return (
    <Stack gap="sm">
      <Title order={5}>{t('recipe.ingredients')}</Title>

      {rows.length === 0 && (
        <Text c="dimmed" size="sm">
          {t('recipe.noIngredients')}
        </Text>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={6}>
            {rows.map((row) => (
              <RecipeIngredientRow
                key={row.id}
                row={row}
                ingredient={ingredientsById.get(row.ingredientId)}
                onRemoved={handleRemoved}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      <NewIngredientRow allIngredients={allIngredients} onCommit={handleCommit} />
    </Stack>
  )
}
