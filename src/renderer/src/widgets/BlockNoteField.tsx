import { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { useMantineColorScheme } from '@mantine/core'
import type { Block } from '@blocknote/core'
import type { AutoFormFieldProps } from '../autoform/types'
import type { BlockNoteDocument } from '@shared/schemas/recipe'

export default function BlockNoteField({
  value,
  onChange,
  label
}: AutoFormFieldProps<BlockNoteDocument>): JSX.Element {
  const { colorScheme } = useMantineColorScheme()
  const editor = useCreateBlockNote({
    initialContent: value.length ? (value as unknown as Block[]) : undefined
  })

  useEffect(() => {
    return editor.onChange(() => {
      onChange(editor.document as unknown as BlockNoteDocument)
    })
  }, [editor, onChange])

  return (
    <div>
      <div className="mantine-InputWrapper-label" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <BlockNoteView
        editor={editor}
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-sm)' }}
      />
    </div>
  )
}
