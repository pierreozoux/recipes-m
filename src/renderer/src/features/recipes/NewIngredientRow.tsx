import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox, Group, NumberInput, Paper, Text, TextInput, useCombobox } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { IngredientWithPrice } from '@shared/schemas/ingredient'

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
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<IngredientWithPrice | null>(null)
  const [quantity, setQuantity] = useState<number | ''>('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const filtered = allIngredients
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20)

  function pick(ingredient: IngredientWithPrice): void {
    setPicked(ingredient)
    combobox.closeDropdown()
    requestAnimationFrame(() => quantityInputRef.current?.focus())
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
        </Group>
      </Paper>
    )
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(id) => {
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
      <Combobox.Dropdown hidden={filtered.length === 0}>
        <Combobox.Options>
          {filtered.map((ingredient) => (
            <Combobox.Option value={ingredient.id} key={ingredient.id}>
              <Group gap="xs" wrap="nowrap">
                <Text fz={16}>{ingredient.icon}</Text>
                <Text size="sm">{ingredient.name}</Text>
              </Group>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
