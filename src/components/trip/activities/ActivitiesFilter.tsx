import { Badge, Button, Group, Input, Paper } from '@mantine/core';
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

  const [countFilters, setCountFilters] = useState<number>(0);

  const { t } = useTranslation();

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
        <Button
          leftSection={
            <IconFilter stroke={2} />
          }
          rightSection={
            <CountFiltersBadge count={countFilters} />
          }
          size={"md"}
        >
          {t("filter_activities", "Filter")}
        </Button>
      </Group>
    </Paper>
  )
}