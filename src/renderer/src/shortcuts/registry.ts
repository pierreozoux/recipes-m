export interface ShortcutEntry {
  labelKey: string
  keys: string
}

export interface ShortcutGroup {
  titleKey: string
  items: ShortcutEntry[]
}

/**
 * Central catalogue of every keyboard shortcut in the app. Used both by the
 * "?" cheat-sheet overlay and, in a few places, by inline <ShortcutHint>
 * chips — so a shortcut only needs to be documented once.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'shortcuts.global',
    items: [
      { labelKey: 'shortcuts.openPalette', keys: 'mod+k' },
      { labelKey: 'shortcuts.showShortcuts', keys: 'shift+/' },
      { labelKey: 'shortcuts.goToRecipes', keys: 'mod+1' },
      { labelKey: 'shortcuts.goToIngredients', keys: 'mod+2' }
    ]
  },
  {
    titleKey: 'shortcuts.list',
    items: [
      { labelKey: 'shortcuts.focusSearch', keys: 'mod+f' },
      { labelKey: 'shortcuts.navigate', keys: 'arrowdownup' },
      { labelKey: 'shortcuts.openItem', keys: 'enter' },
      { labelKey: 'shortcuts.createNew', keys: 'mod+n' },
      { labelKey: 'shortcuts.deleteItem', keys: 'mod+backspace' }
    ]
  },
  {
    titleKey: 'shortcuts.recipeForm',
    items: [
      { labelKey: 'shortcuts.moveToQuantity', keys: 'enter' },
      { labelKey: 'shortcuts.addIngredientRow', keys: 'enter' },
      { labelKey: 'shortcuts.deleteEmptyRow', keys: 'tab' }
    ]
  }
]
