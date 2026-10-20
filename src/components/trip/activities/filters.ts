import type { Activity, ActivityStatus, TravellerProfile } from '../../../types/trips.ts';

export type ActivityFilters = {
  status: ActivityStatus | 'all';
  destinations: string[];
  travellers: string[];
};

export type ActivityFilterNames = keyof ActivityFilters;

export const defaultActivityFilters: ActivityFilters = {
  status: 'all',
  destinations: [],
  travellers: [],
};

const mapFilters: Record<ActivityFilterNames, (value: any) => (activity: Activity) => boolean> = {
  status: (value: ActivityStatus) => (activity: Activity) => activity.status === value,
  destinations: (values: string[]) => (activity: Activity) => values.includes(activity.metadata?.place?.id),
  travellers: (values: string[]) => (activity: Activity) => (activity.travellers?.length === 0 || !!activity.travellers?.some(traveller => values.includes(traveller)))
};

export const NO_TRAVELER: TravellerProfile = {
  id: 'NO_TRAVELER_ID',
  email: '',
  legalName: 'No travelers'
};

export const filterActivities = (
  activityList: Activity[],
  partialActivityFilters: Partial<ActivityFilters> = {}
): Activity[] => {

  if (countActiveFilters(partialActivityFilters) === 0) {
    return [...activityList];
  }

  const activeFilters = getActiveFilters(partialActivityFilters);

  let filteredActivityList = [...activityList];

  Object.entries(activeFilters).forEach(([filterName, filterValue]) => {
    if (defaultActivityFilters[filterName as ActivityFilterNames] === filterValue) {
      return;
    }

    filteredActivityList = filteredActivityList.filter(mapFilters[filterName as ActivityFilterNames](filterValue));
  });

  return [...filteredActivityList];
};

export const getActiveFilters = (activityFilters: Partial<ActivityFilters>): Partial<ActivityFilters> => {
  return Object.keys(activityFilters).reduce((carry: Partial<ActivityFilters>, filterName: string) => {
    const defaultFilterValue = defaultActivityFilters[filterName as ActivityFilterNames];
    const filterValue = activityFilters[filterName as ActivityFilterNames];

    if (typeof defaultFilterValue !== typeof filterValue) {
      return {
        ...carry,
        [filterName]: filterValue,
      };
    }

    if ((typeof defaultFilterValue === 'string') && (typeof filterValue === 'string')) {
      if (filterValue !== defaultFilterValue) {
        return {
          ...carry,
          [filterName]: filterValue,
        };
      }
    }

    if (Array.isArray(defaultFilterValue) && Array.isArray(filterValue)) {
      if (defaultFilterValue.length !== filterValue.length) {
        return {
          ...carry,
          [filterName]: filterValue,
        };
      }

      const sortedDefaultFilterValue = [...defaultFilterValue].sort();
      const sortedFilterValue = [...filterValue].sort();

      if (sortedFilterValue.join(',') !== sortedDefaultFilterValue.join(',')) {
        return {
          ...carry,
          [filterName]: filterValue,
        };
      }
    }

    return {
      ...carry,
    };
  }, {});
};

export const countActiveFilters = (partialActivityFilters: Partial<ActivityFilters> = {}): number => {
  return Object.keys(getActiveFilters(partialActivityFilters)).length;
};
