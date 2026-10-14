import type { DraftActivity, PlannedActivity } from '../../src/types/trips.ts';

const plannedActivity = {
  id: 'activity-1',
  name: 'Visit the Louvre',
  description: 'See the Mona Lisa',
  address: 'Louvre Museum, Paris',
  startDate: '2026-06-10T09:30:00',
  endDate: '2026-06-10T12:00:00',
  status: 'planned',
  trip: 'trip-1',
} as PlannedActivity;

const draftActivity = {
  id: 'activity-2',
  name: 'Maybe a boat tour',
  description: '',
  status: 'draft',
  trip: 'trip-1',
} as DraftActivity;

export {
  plannedActivity,
  draftActivity,
}