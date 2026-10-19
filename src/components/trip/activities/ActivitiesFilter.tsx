import { Badge, Button, Group, Input, Paper, Popover, Stack, Grid } from '@mantine/core';
import { IconFilter, IconWorldSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { type ActivityFilterNames, type ActivityFilters, getActiveFilters, defaultActivityFilters } from './filters.ts';
import { StatusFilter } from './filters/StatusFilter.tsx';
import { SearchableFilter } from './filters/SearchableFilter.tsx';
import { Place } from '../../../types/trips.ts';
import { DestinationChipFilter, StatusChipFilter } from './filters/ChipFilter.tsx';

const CountFiltersBadge = ({ count }: { count: number }) => {
  if (count === 0) {
    return null;
  }

  return <Badge variant={'white'}>{count}</Badge>;
};

type ActivitiesFilterProps = {
  onApplyFilters: (activityFilters: ActivityFilters) => void;
  onResetFilters: () => void;
  destinations: Place[];
};

export const ActivitiesFilter = ({ onApplyFilters, onResetFilters, destinations = [] }: ActivitiesFilterProps) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<ActivityFilters>({
    ...defaultActivityFilters,
  });

  const form = useForm<ActivityFilters>({
    initialValues: currentFilters,
  });

  const activeFilters = getActiveFilters(currentFilters);
  const countFilters = Object.keys(activeFilters).length;

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

  const handleClearFilter = (filterName: ActivityFilterNames, valueToClear?: string) => {

    if (!valueToClear) {
      form.resetField(filterName);
    }
    else {
      const currentValues = currentFilters[filterName];
      if (!Array.isArray(currentValues)) {
        return;
      }
      const newValues = [...currentValues].filter((value) => value !== valueToClear);
      if (newValues.length === 0) {
        form.resetField(filterName);
      }
      else {
        form.setValues({[filterName]: newValues});
      }
    }
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
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <StatusFilter key={form.key('status')} inputProps={form.getInputProps('status')} />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <SearchableFilter
                      label={t('activity_place', 'Destination')}
                      description={t('activity_place_desc', 'Associated destination')}
                      options={destinations.map((place) => ({
                        value: place.id,
                        label: place.name,
                        description: `${place.stateName}, ${place.countryName}`,
                      }))}
                      disabled={destinations.length === 0}
                      {...form.getInputProps('destinations')}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group gap={'sm'} justify={'flex-end'} mt={'sm'}>
                      <Button variant={'subtle'} onClick={handleResetFilters}>
                        {t('reset', 'Reset')}
                      </Button>
                      <Button onClick={handleApplyFilters}>{t('apply', 'Apply')}</Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </form>
            </Popover.Dropdown>
          </Popover>
        </Group>
        {countFilters > 0 && (
          <Group gap={'sm'} className={'filter_pills'}>
            {activeFilters.status && (
              <StatusChipFilter
                valueToDisplay={activeFilters.status}
                onClearFilter={() => handleClearFilter('status')}
              />
            )}
            {activeFilters.destinations && (
              <Group gap={'sm'}>
                {activeFilters.destinations.map((destinationId) => (
                  <DestinationChipFilter
                    valueToDisplay={destinations.find((place) => place.id === destinationId)?.name || ''}
                    onClearFilter={() => handleClearFilter('destinations', destinationId)}
                  />
                ))}
              </Group>
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  );
};
