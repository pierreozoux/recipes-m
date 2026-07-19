import { z } from 'zod'
import { NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { UiSchema } from './types'

interface AutoFormProps<T extends Record<string, unknown>> {
  schema: z.ZodObject<z.ZodRawShape>
  values: T
  onFieldChange: <K extends keyof T>(field: K, value: T[K]) => void
  uiSchema?: UiSchema<T>
  errors?: Partial<Record<keyof T, string>>
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return unwrap(schema.unwrap())
  }
  if (schema instanceof z.ZodDefault) {
    return unwrap(schema._def.innerType)
  }
  return schema
}

/**
 * Renders a Mantine form from a Zod object schema: the schema (the same one
 * used for tRPC input validation, the DB layer, and the OpenAPI export) is
 * the single source of truth for each field's type. `uiSchema` is the
 * escape hatch for fields that need a bespoke widget (BlockNote, emoji
 * picker, ...) instead of the type-inferred input.
 */
export default function AutoForm<T extends Record<string, unknown>>({
  schema,
  values,
  onFieldChange,
  uiSchema,
  errors
}: AutoFormProps<T>): JSX.Element {
  const { t } = useTranslation()
  const shape = schema.shape

  return (
    <Stack gap="md">
      {Object.entries(shape).map(([field, fieldSchema]) => {
        const key = field as keyof T
        const config = uiSchema?.[key]
        if (config?.hidden) return null

        const label = t(config?.labelKey ?? `field.${field}`, field)
        const value = values[key]
        const error = errors?.[key]

        if (config?.widget) {
          const Widget = config.widget
          return (
            <Widget
              key={field}
              value={value}
              onChange={(v) => onFieldChange(key, v as T[keyof T])}
              label={label}
              error={error}
            />
          )
        }

        const base = unwrap(fieldSchema as z.ZodTypeAny)

        if (base instanceof z.ZodEnum) {
          const options = base.options as string[]
          return (
            <Select
              key={field}
              label={label}
              data={options.map((opt) => ({ value: opt, label: opt }))}
              value={(value as string) ?? null}
              onChange={(v) => v && onFieldChange(key, v as T[keyof T])}
              error={error}
              allowDeselect={false}
            />
          )
        }

        if (base instanceof z.ZodNumber) {
          return (
            <NumberInput
              key={field}
              label={label}
              value={value as number}
              onChange={(v) => onFieldChange(key, (typeof v === 'number' ? v : 0) as T[keyof T])}
              error={error}
            />
          )
        }

        return (
          <TextInput
            key={field}
            label={label}
            value={(value as string) ?? ''}
            onChange={(e) => onFieldChange(key, e.currentTarget.value as T[keyof T])}
            error={error}
          />
        )
      })}
    </Stack>
  )
}
