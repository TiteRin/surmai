import { Badge, Button, Group, Input, Paper, Popover, Stack, Chip } from '@mantine/core';
import { IconFilter, IconWorldSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { ActivityFilterNames, ActivityFilters, countActiveFilters, defaultActivityFilters } from './filters.ts';
import { StatusFilter } from './filters/StatusFilter.tsx';

const CountFiltersBadge = ({ count }: { count: number }) => {
  if (count === 0) {
    return null;
  }

  return <Badge variant={'white'}>{count}</Badge>;
};

type ActivitiesFilterProps = {
  onApplyFilters: (activityFilters: ActivityFilters) => void;
  onResetFilters: () => void;
};

export const ActivitiesFilter = ({ onApplyFilters, onResetFilters }: ActivitiesFilterProps) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<ActivityFilters>({
    ...defaultActivityFilters,
    status: 'all',
  });

  const form = useForm<ActivityFilters>({
    initialValues: currentFilters,
  });

  const countFilters = countActiveFilters(currentFilters);

  const { t } = useTranslation();

  const handleResetFilters = () => {
    form.reset();
    setCurrentFilters(form.getValues());
    onResetFilters();
    setShowFilters(false);
  };

  const handleApplyFilters = () => {
    setCurrentFilters(form.getValues());
    onApplyFilters(form.getValues());
    setShowFilters(false);
  };

  const handleClearFilter = (filterName: ActivityFilterNames) => {
    form.resetField(filterName);
    handleApplyFilters();
  };

  return (
    <Paper mt={'sm'}>
      <Stack gap={'sm'} p={'md'}>
        <Group gap={'sm'}>
          <Input
            placeholder={t('search_activities', 'Search an activity')}
            size={'md'}
            style={{ flexGrow: 1 }}
            leftSection={<IconWorldSearch stroke={2} />}
          />
          <Popover opened={showFilters} onDismiss={() => setShowFilters(false)}>
            <Popover.Target>
              <Button
                leftSection={<IconFilter stroke={2} />}
                rightSection={<CountFiltersBadge count={countFilters} />}
                size={'md'}
                onClick={() => setShowFilters((show) => !show)}
              >
                {t('filter_activities', 'Filters')}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <form>
                <StatusFilter key={form.key('status')} inputProps={form.getInputProps('status')} />
                <Group gap={'sm'} justify={'flex-end'} mt={'sm'}>
                  <Button variant={'subtle'} onClick={handleResetFilters}>
                    {t('reset', 'Reset')}
                  </Button>
                  <Button onClick={handleApplyFilters}>{t('apply', 'Apply')}</Button>
                </Group>
              </form>
            </Popover.Dropdown>
          </Popover>
        </Group>
        {countFilters > 0 && (
          <Group gap={'sm'} className={'filter_pills'}>
            {Object.entries(currentFilters).map(([filterName, filterValues]) => {
              return (
                <Chip defaultChecked size={'md'} onChange={() => handleClearFilter(filterName as ActivityFilterNames)}>
                  {t(filterValues, filterValues)}
                </Chip>
              );
            })}
          </Group>
        )}
      </Stack>
    </Paper>
  );
};
