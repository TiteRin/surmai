import type { Activity, ActivityStatus } from '../../../types/trips.ts';

export type ActivityFilters = {
  status: ActivityStatus | "all";
}

export type ActivityFilterNames = keyof ActivityFilters;

export const defaultActivityFilters: ActivityFilters = {
  status: "all"
}

const getFilters = (filters: Partial<ActivityFilters>): ActivityFilters => ({
  ...defaultActivityFilters,
  ...filters
})

export const filterActivities = (
  activityList: Activity[],
  partialActivityFilters: Partial<ActivityFilters> = {}
): Activity[] => {

  if (countActiveFilters(partialActivityFilters) === 0) {
    return [...activityList];
  }

  if (partialActivityFilters.status !== defaultActivityFilters.status) {
    return activityList.filter(activity => activity.status === partialActivityFilters.status);
  }

  return [...activityList];
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

      return carry;
    }, 0);
}