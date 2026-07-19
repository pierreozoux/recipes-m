import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox, Group, NumberInput, Paper, Text, TextInput, useCombobox } from '@mantine/core'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { trpc } from '../../api/trpc'
import type { IngredientWithPrice } from '@shared/schemas/ingredient'

const CREATE_OPTION_VALUE = '__create__'

interface NewIngredientRowProps {
  allIngredients: IngredientWithPrice[]
  onCommit: (ingredientId: string, quantityPerPerson: number) => void
}

/**
 * Trailing "add ingredient" row: type to search, arrow keys move through
 * the dropdown (first match pre-selected), Enter picks it and moves focus
 * to the quantity field, Enter again commits the row and resets back to a
 * blank search box so the next ingredient can be typed immediately.
 */
export default function NewIngredientRow({ allIngredients, onCommit }: NewIngredientRowProps): JSX.Element {
  const { t } = useTranslation()
  const utils = trpc.useUtils()
  const createMutation = trpc.ingredients.create.useMutation()
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<IngredientWithPrice | null>(null)
  const [quantity, setQuantity] = useState<number | ''>('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const trimmedSearch = search.trim()
  const filtered = allIngredients
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20)
  const hasExactMatch = allIngredients.some((i) => i.name.toLowerCase() === trimmedSearch.toLowerCase())
  const showCreateOption = trimmedSearch.length > 0 && !hasExactMatch

  function pick(ingredient: IngredientWithPrice): void {
    setPicked(ingredient)
    combobox.closeDropdown()
    requestAnimationFrame(() => quantityInputRef.current?.focus())
  }

  async function createAndPick(name: string): Promise<void> {
    const created = await createMutation.mutateAsync({ name })
    await utils.ingredients.list.invalidate()
    pick(created)
  }

  function reset(): void {
    setSearch('')
    setPicked(null)
    setQuantity('')
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  function commit(): void {
    if (!picked) return
    const value = typeof quantity === 'number' ? quantity : 0
    onCommit(picked.id, value)
    reset()
  }

  if (picked) {
    return (
      <Paper p="xs" radius="sm" bg="var(--mantine-color-gray-light)">
        <Group wrap="nowrap" gap="sm">
          <Text fz={18} lh={1} w={26} ml={30}>
            {picked.icon}
          </Text>
          <Text flex={1} fw={500}>
            {picked.name}
          </Text>
          <NumberInput
            ref={quantityInputRef}
            w={130}
            size="sm"
            decimalScale={2}
            min={0}
            autoFocus
            placeholder={t('recipe.quantityPerPerson')}
            value={quantity}
            onChange={(v) => setQuantity(typeof v === 'number' ? v : v === '' ? '' : Number(v))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                reset()
              }
            }}
          />
          <Text size="sm" c="dimmed" w={20}>
            {picked.unit}
          </Text>
        </Group>
      </Paper>
    )
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(id) => {
        if (id === CREATE_OPTION_VALUE) {
          createAndPick(trimmedSearch)
          return
        }
        const ingredient = filtered.find((i) => i.id === id)
        if (ingredient) pick(ingredient)
      }}
    >
      <Combobox.Target>
        <TextInput
          ref={searchInputRef}
          leftSection={<IconSearch size={14} />}
          placeholder={t('recipe.searchIngredientPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            combobox.openDropdown()
            combobox.selectFirstOption()
          }}
          onFocus={() => search.length > 0 && combobox.openDropdown()}
          onClick={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              combobox.selectNextOption()
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              combobox.selectPreviousOption()
            } else if (e.key === 'Enter') {
              e.preventDefault()
              combobox.clickSelectedOption()
            }
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown hidden={filtered.length === 0 && !showCreateOption}>
        <Combobox.Options>
          {filtered.map((ingredient) => (
            <Combobox.Option value={ingredient.id} key={ingredient.id}>
              <Group gap="xs" wrap="nowrap">
                <Text fz={16}>{ingredient.icon}</Text>
                <Text size="sm">{ingredient.name}</Text>
              </Group>
            </Combobox.Option>
          ))}
          {showCreateOption && (
            <Combobox.Option value={CREATE_OPTION_VALUE}>
              <Group gap="xs" wrap="nowrap">
                <IconPlus size={16} />
                <Text size="sm">{t('recipe.createIngredientOption', { name: trimmedSearch })}</Text>
              </Group>
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
