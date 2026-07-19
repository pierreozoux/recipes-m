export const isMac = navigator.platform.toLowerCase().includes('mac')

const KEY_LABELS: Record<string, string> = {
  mod: isMac ? '⌘' : 'Ctrl',
  shift: isMac ? '⇧' : 'Shift',
  alt: isMac ? '⌥' : 'Alt',
  ctrl: 'Ctrl',
  enter: '⏎',
  arrowup: '↑',
  arrowdown: '↑↓',
  arrowdownup: '↑↓',
  tab: 'Tab',
  escape: 'Esc',
  delete: isMac ? '⌫' : 'Del',
  backspace: isMac ? '⌫' : 'Backspace',
  space: 'Space'
}

/** Splits a hotkey combo like "mod+shift+N" into its display parts, e.g. ["⌘", "⇧", "N"]. */
export function splitAccelerator(keys: string): string[] {
  return keys.split('+').map((part) => KEY_LABELS[part.toLowerCase()] ?? part.toUpperCase())
}
