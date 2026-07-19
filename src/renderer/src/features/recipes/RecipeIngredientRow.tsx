import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ActionIcon, Group, NumberInput, Paper, Text } from '@mantine/core'
import { IconGripVertical, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useAutosavePatch } from '../../hooks/useAutosavePatch'
import { trpc } from '../../api/trpc'
import type { IngredientWithPrice } from '@shared/schemas/ingredient'
import type { RecipeIngredient } from '@shared/schemas/recipe'

interface RecipeIngredientRowProps {
  row: RecipeIngredient
  ingredient: IngredientWithPrice | undefined
  onRemoved: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
}

export default function RecipeIngredientRow({
  row,
  ingredient,
  onRemoved,
  onQuantityChange
}: RecipeIngredientRowProps): JSX.Element {
  const { t } = useTranslation()
  const utils = trpc.useUtils()
  const removeMutation = trpc.recipes.removeIngredient.useMutation()
  const updateMutation = trpc.recipes.updateIngredient.useMutation()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id
  })

  const { schedule } = useAutosavePatch<{ quantityPerPerson: number }>(async (patch) => {
    await updateMutation.mutateAsync({ id: row.id, ...patch })
  })

  async function handleRemove(): Promise<void> {
    onRemoved(row.id)
    await removeMutation.mutateAsync({ id: row.id })
    await utils.recipes.getById.invalidate({ id: row.recipeId })
  }

  function handleQuantityChange(value: string | number): void {
    const quantity = typeof value === 'number' ? value : Number(value) || 0
    onQuantityChange(row.id, quantity)
    schedule({ quantityPerPerson: quantity })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Tab' && !e.shiftKey && e.currentTarget.value === '') {
      handleRemove()
    }
  }

  return (
    <Paper
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      p="xs"
      radius="sm"
    >
      <Group wrap="nowrap" gap="sm">
        <ActionIcon variant="subtle" color="gray" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
          <IconGripVertical size={16} />
        </ActionIcon>
        <Text fz={18} lh={1} w={26}>
          {ingredient?.icon}
        </Text>
        <Text flex={1} fw={500} truncate>
          {ingredient?.name ?? '…'}
        </Text>
        <NumberInput
          w={130}
          size="sm"
          decimalScale={2}
          min={0}
          placeholder={t('recipe.quantityPerPerson')}
          value={row.quantityPerPerson}
          onChange={handleQuantityChange}
          onKeyDown={handleKeyDown}
        />
        <ActionIcon color="red" variant="subtle" onClick={handleRemove} aria-label={t('common.delete')}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  )
}
