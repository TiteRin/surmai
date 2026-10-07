import { TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { UseFormReturnType } from '@mantine/form';

type CategorySelectProps = {
  propName: string,
  form: UseFormReturnType<unknown>
}

export function CategorySelect(
  {
  propName,
  form
}: CategorySelectProps) {

  const { t } = useTranslation();

  return (
    <TextInput
      name={'category'}
      label={t('category', 'Category')}
      key={form.key('category')}
      description={t('category_desc', 'Related category')}
      {...form.getInputProps('category')}
    />
  )
}