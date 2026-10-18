import type { Activity, ActivityStatus } from '../../../types/trips.ts';

export type ActivityFilters = {
  status: ActivityStatus | "all";
  destinations?: string[];
}

export type ActivityFilterNames = keyof ActivityFilters;

export const defaultActivityFilters: ActivityFilters = {
  status: "all",
  destinations: []
}

const getFilters = (filters: Partial<ActivityFilters>): ActivityFilters => ({
  ...defaultActivityFilters,
  ...filters
});

const mapFilters: Record<ActivityFilterNames, (value: any) => (activity: Activity) => boolean> = {
  "status": (value: ActivityStatus) => ((activity: Activity) => activity.status === value),
  "destinations": (values: string[]) => ((activity: Activity) => values.includes(activity.metadata?.place?.id))
}

export const filterActivities = (
  activityList: Activity[],
  partialActivityFilters: Partial<ActivityFilters> = {}
): Activity[] => {

  if (countActiveFilters(partialActivityFilters) === 0) {
    return [...activityList];
  }

  let filteredActivityList = [...activityList];

  Object.entries(partialActivityFilters).forEach(
    ([filterName, filterValue]) => {
      if (defaultActivityFilters[filterName as ActivityFilterNames] === filterValue) {
        return;
      }

      filteredActivityList = filteredActivityList.filter(
        mapFilters[filterName as ActivityFilterNames](filterValue)
      );
  });

  return [...filteredActivityList];
}

export const countActiveFilters = (
  partialActivityFilters: Partial<ActivityFilters> = {}
): number => {

  const filters = getFilters(partialActivityFilters);

  return Object.keys(filters)
    .reduce((carry, filterName) => {

      const defaultFilterValue = defaultActivityFilters[filterName as ActivityFilterNames];
      const filterValue = filters[filterName as ActivityFilterNames];

      if (typeof defaultFilterValue !== typeof filterValue) {
        return carry + 1;
      }

      if (typeof defaultFilterValue === "string") {
        return carry + Number(filterValue !== defaultFilterValue);
      }

      if (Array.isArray(defaultFilterValue) && Array.isArray(filterValue)) {

        if (defaultFilterValue.length !== filterValue.length) {
          return carry + 1;
        }

        const sortedDefaultFilterValue = [...defaultFilterValue].sort();
        const sortedFilterValue = [...filterValue].sort();

        return carry + Number(sortedDefaultFilterValue.join(",") !== sortedFilterValue.join(","));
      }

      return carry;
    }, 0);
}