import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Popover, Text, UnstyledButton } from '@mantine/core'
import { EmojiPicker } from 'frimousse'
import type { AutoFormFieldProps } from '../autoform/types'

import './EmojiField.css'

export default function EmojiField({ value, onChange, label }: AutoFormFieldProps<string>): JSX.Element {
  const { i18n } = useTranslation()
  const [opened, setOpened] = useState(false)

  return (
    <Box>
      <Text size="sm" fw={500} mb={4}>
        {label}
      </Text>
      <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow shadow="md">
        <Popover.Target>
          <UnstyledButton
            onClick={() => setOpened((o) => !o)}
            style={{
              width: 44,
              height: 44,
              fontSize: 22,
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--mantine-color-default-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={label}
          >
            {value || '🥕'}
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p={0}>
          <EmojiPicker.Root
            locale={i18n.resolvedLanguage === 'fr' ? 'fr' : 'en'}
            className="emoji-picker"
            onEmojiSelect={({ emoji }) => {
              onChange(emoji)
              setOpened(false)
            }}
          >
            <EmojiPicker.Search className="emoji-picker-search" />
            <EmojiPicker.Viewport className="emoji-picker-viewport">
              <EmojiPicker.Loading className="emoji-picker-loading">…</EmojiPicker.Loading>
              <EmojiPicker.Empty className="emoji-picker-empty">🔍</EmojiPicker.Empty>
              <EmojiPicker.List className="emoji-picker-list" />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </Popover.Dropdown>
      </Popover>
    </Box>
  )
}
