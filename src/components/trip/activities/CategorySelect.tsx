import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { UseFormReturnType } from '@mantine/form';
import { ActivityCategory } from '@/src/types/trips.ts';

type CategorySelectProps = {
  propName: string;
  form: UseFormReturnType<unknown>;
  categories: ActivityCategory[];
};

export function CategorySelect({ propName, form, categories }: CategorySelectProps) {
  const { t } = useTranslation();

  return (
    <Select
      label={t('category', 'Category')}
      description={t('category_desc', 'Related category')}
      key={form.key(propName)}
      name={propName}
      {...form.getInputProps(propName)}
      data={categories.map((category) => ({
        value: category.id,
        label: `${category.emoji} ${category.name}`,
      }))}
      checkIconPosition="right"
    />
  );
}
