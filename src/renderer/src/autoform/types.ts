import type { ReactNode } from 'react'

export interface AutoFormFieldProps<V = unknown> {
  value: V
  onChange: (value: V) => void
  label: string
  error?: string
}

export type FieldWidget<V = never> = (props: AutoFormFieldProps<V>) => ReactNode

export interface FieldUiConfig<V = never> {
  /** Escape hatch: render this instead of the type-inferred Mantine input. */
  widget?: FieldWidget<V>
  /** i18n key for the label; defaults to `field.<fieldName>`. */
  labelKey?: string
  /** Don't render this field at all (e.g. id, timestamps). */
  hidden?: boolean
}

export type UiSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldUiConfig<T[K]>
}
