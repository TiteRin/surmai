import { Activity, ActivityStatus } from '../../../types/trips.ts';

type ActivityFilters = {
  status: ActivityStatus | "all";
}

const defaultActivityFilters: ActivityFilters = {
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
    .reduce((carry: number, filterName: string) => {
      return carry + (filters[filterName] !== defaultActivityFilters[filterName]);
    }, 0);
}