import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AspectRatio, Button, Group, Image, Stack, Text } from '@mantine/core'
import { IconPhoto } from '@tabler/icons-react'
import { trpc } from '../api/trpc'

interface RecipeImageFieldProps {
  recipeId: string
  imagePath: string | null
  onChanged: () => void
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function RecipeImageField({ recipeId, imagePath, onChanged }: RecipeImageFieldProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const utils = trpc.useUtils()
  const setImageMutation = trpc.recipes.setImage.useMutation()
  const updateMutation = trpc.recipes.update.useMutation()

  const dataUrlQuery = trpc.recipes.getImageDataUrl.useQuery(
    { id: recipeId },
    { enabled: Boolean(imagePath) }
  )

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataBase64 = await readFileAsBase64(file)
    await setImageMutation.mutateAsync({ recipeId, fileName: file.name, dataBase64 })
    await Promise.all([utils.recipes.getImageDataUrl.invalidate({ id: recipeId }), utils.recipes.getById.invalidate({ id: recipeId })])
    onChanged()
  }

  async function handleRemove(): Promise<void> {
    await updateMutation.mutateAsync({ id: recipeId, imagePath: null })
    await utils.recipes.getById.invalidate({ id: recipeId })
    onChanged()
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {t('recipe.image')}
      </Text>
      {imagePath && dataUrlQuery.data ? (
        <AspectRatio ratio={16 / 9} maw={360}>
          <Image src={dataUrlQuery.data} radius="sm" alt="" />
        </AspectRatio>
      ) : (
        <Stack
          align="center"
          justify="center"
          maw={360}
          h={140}
          bg="var(--mantine-color-gray-light)"
          style={{ borderRadius: 'var(--mantine-radius-sm)' }}
        >
          <IconPhoto size={28} color="var(--mantine-color-dimmed)" />
        </Stack>
      )}
      <Group gap="sm">
        <Button size="xs" variant="light" onClick={() => inputRef.current?.click()}>
          {imagePath ? t('recipe.changeImage') : t('recipe.image')}
        </Button>
        {imagePath && (
          <Button size="xs" variant="subtle" color="red" onClick={handleRemove}>
            {t('recipe.removeImage')}
          </Button>
        )}
      </Group>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={handleFileSelected}
      />
    </Stack>
  )
}
