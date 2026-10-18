import type { Activity, DraftActivity, PlannedActivity } from '../../src/types/trips.ts';

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

const parisActivity = {
  id: 'activity-3',
  name: 'Visit the Louvre',
  description: 'See the Mona Lisa',
  address: 'Louvre Museum, Paris',
  startDate: '2026-06-10T09:30:00',
  endDate: '2026-06-10T12:00:00',
  status: 'planned',
  trip: 'trip-1',
  metadata: {
    place: {
      id: 'paris',
      name: 'Paris',
      countryName: 'France',
      latitude: '48.856614',
      longitude: '2.3522219',
    }
  }
} as unknown as Activity;

const londonActivity = {
  id: 'activity-4',
  name: 'Visit the Tower Bridge',
  description: '',
  address: 'Tower Bridge, London',
  startDate: '2026-06-10T09:30:00',
  endDate: '2026-06-10T12:00:00',
  status: 'planned',
  trip: 'trip-1',
  metadata: {
    place: {
      id: 'london',
      name: 'London',
      countryName: 'England',
      latitude: '51.507351',
      longitude: '-0.1277583',
    }
  }
}

export {
  plannedActivity,
  draftActivity,
  parisActivity,
  londonActivity
}