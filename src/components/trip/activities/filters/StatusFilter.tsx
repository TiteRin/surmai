import { Radio, SegmentedControl, Stack, Input } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSurmaiContext } from '../../../../app/useSurmaiContext.ts';

type StatusFilterProps = {
  key: string;
  inputProps: Record<string, any>;
};

export const StatusFilter = ({ key, inputProps }: StatusFilterProps) => {
  const { t } = useTranslation();
  const { isMobile } = useSurmaiContext();

  if (isMobile) {
    return (
      <Input.Wrapper label={t('filters_activities_status', 'Status')}>
        <SegmentedControl
          name={'status'}
          fullWidth
          key={key}
          data={[
            {
              value: 'all',
              label: t('all', 'All'),
            },
            {
              value: 'draft',
              label: t('draft', 'Draft'),
            },
            {
              value: 'planned',
              label: t('planned', 'Planned'),
            },
          ]}
          {...inputProps}
        />
      </Input.Wrapper>
    );
  }

  return (
    <Radio.Group name={'status'} label={t('filters_activities_status', 'Status')} key={key} {...inputProps}>
      <Stack gap={'xs'} mt={'sm'}>
        <Radio value={'all'} label={t('all', 'All')} />
        <Radio value={'draft'} label={t('draft', 'Draft')} />
        <Radio value={'planned'} label={t('planned', 'Planned')} />
      </Stack>
    </Radio.Group>
  );
};
