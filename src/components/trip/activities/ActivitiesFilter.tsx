import { Badge, Button, Grid, Group, Input, Paper, Popover } from '@mantine/core';
import { IconFilter, IconWorldSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const CountFiltersBadge = ({count}: {count: number}) => {
  if (count === 0) {
    return null;
  }

  return (
    <Badge variant={"white"}>
      { count }
    </Badge>
  )
}

type ActivitiesFilterProps = {}

export const ActivitiesFilter = (props: ActivitiesFilterProps) => {

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [countFilters, setCountFilters] = useState<number>(0);

  const { t } = useTranslation();

  const onResetFilters = () => {

    setShowFilters(false);
  }

  const onApplyFilters = () => {

    setShowFilters(false);
  }

  return (
    <Paper mt={"sm"}>
      <Group p={"md"} gap={"sm"}>
        <Input
          placeholder={t("search_activities", "Search an activity")}
          size={"md"}
          style={{flexGrow: 1}}
          leftSection={
          <IconWorldSearch stroke={2} />
        } />
        <Popover opened={showFilters} onDismiss={() => setShowFilters(false)}>
          <Popover.Target>
            <Button
              leftSection={
                <IconFilter stroke={2} />
              }
              rightSection={
                <CountFiltersBadge count={countFilters} />
              }
              size={"md"}
              onClick={() => setShowFilters(show => !show)}
            >
              {t("filter_activities", "Filters")}
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <form>
              <Group gap={"sm"} justify={"flex-end"}>
                <Button variant={"subtle"} onClick={onResetFilters}>
                  {t("reset", "Reset")}
                </Button>
                <Button onClick={onApplyFilters}>
                  {t("apply", "Apply")}
                </Button>
              </Group>
            </form>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Paper>
  )
}