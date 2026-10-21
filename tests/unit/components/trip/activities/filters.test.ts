import { describe, expect, it } from 'vitest';
import {
  countActiveFilters,
  getActiveFilters,
  defaultActivityFilters,
  filterActivities,
} from '../../../../../src/components/trip/activities/filters.ts';
import { plannedActivity, draftActivity, parisActivity, londonActivity } from '../../../fixtures.tsx';
import { Activity } from '../../../../../src/types/trips.ts';

describe('filters', () => {
  it('when given an empty activity list, should return an empty list', () => {
    expect(filterActivities([])).toEqual([]);
  });

  it('when given no filter, should return a list with the same activities', () => {
    const activities = [plannedActivity, draftActivity];
    expect(filterActivities(activities)).toEqual(activities);
  });

  it('should not modified the list passed in parameters (not mutable)', () => {
    const activities = [plannedActivity, draftActivity];
    expect(filterActivities(activities)).not.toBe(activities);
  });

  describe('by status', () => {
    const activities = [plannedActivity, draftActivity];

    it('when status is set to all, should return all activities', () => {
      expect(filterActivities(activities, { status: 'all' })).toEqual(activities);
    });

    it('when status is set to draft, should only return the draft item', () => {
      expect(filterActivities(activities, { status: 'draft' })).toEqual([draftActivity]);
    });

    it('when status is set to planned, should only return the planned item', () => {
      expect(filterActivities(activities, { status: 'planned' })).toEqual([plannedActivity]);
    });
  });

  describe('by destination', () => {
    const activities = [draftActivity, parisActivity, londonActivity] as unknown as Activity[];

    it('when destination is set to all, should return all activities', () => {
      expect(filterActivities(activities, { destinations: [] })).toEqual(activities);
    });

    it('when a destination is selected, should return only activities with that destination', () => {
      expect(filterActivities(activities, { destinations: ['paris'] })).toEqual([parisActivity]);
    });

    it('when multiple destinations are selected, should return only activities with those destinations', () => {
      expect(filterActivities(activities, { destinations: ['paris', 'london'] })).toEqual([
        parisActivity,
        londonActivity,
      ]);
    });

    it('when a selected destination is not in activities, should return an empty list', () => {
      expect(filterActivities(activities, { destinations: ['madrid'] })).toEqual([]);
    });
  });

  describe('by dates', () => {
    const noDateActivity = {
      ...draftActivity
    }
    const inRangeActivity = {
      ...plannedActivity,
      startDate: '2026-06-10T09:30:00',
      endDate: '2026-06-10T12:00:00',
    };
    const outOfRangeActivity = {
      ...plannedActivity,
      startDate: '2026-06-12T09:30:00',
      endDate: '2026-06-12T12:00:00',
    };

    const dateFilter = { dates: ['2026-06-10', '2026-06-11']};

    it('if the date range is not valid, throw an error', () => {
      expect(() => filterActivities([], { dates: ['2026-06-10', '2026-06-09']})).toThrowError();
    });

    it('when no dates are defined, should return all activities', () => {
      const activities = [inRangeActivity, outOfRangeActivity];
      expect(filterActivities(activities, { dates: null })).toEqual(activities);
    });

    it('when a date range is selected, should return only activities whose dates overlap', () => {
      const activities = [inRangeActivity, outOfRangeActivity];
      expect(filterActivities(activities, dateFilter)).toEqual([inRangeActivity]);
    });

    it('when a date range is selected, draft without dates are not visible', () => {
        const activities = [noDateActivity];
        expect(filterActivities(activities, dateFilter)).toEqual([]);
    });
  });
});

describe('countActiveFilters', () => {
  it('when given no filters, should return 0', () => {
    expect(countActiveFilters()).toBe(0);
  });

  it('when given a status:all, should return 0', () => {
    expect(countActiveFilters({ status: 'all' })).toBe(0);
  });

  it('when given a status different of all, should return 1', () => {
    expect(countActiveFilters({ status: 'draft' })).toBe(1);
    expect(countActiveFilters({ status: 'planned' })).toBe(1);
  });

  it('when given a destination, should return 1', () => {
    expect(countActiveFilters({ destinations: ['Paris, France'] })).toBe(1);
  });

  it('when given a status and a destination filter, should return 2', () => {
    expect(
      countActiveFilters({
        status: 'draft',
        destinations: ['Paris, France'],
      })
    ).toBe(2);
  });
});

describe("getActiveFilters", () => {
  it("when given the defaultFilters, should return an empty object", () => {
    expect(getActiveFilters(defaultActivityFilters)).toEqual({});
  });

  it("when given an empty object, should return an empty object", () => {
    expect(getActiveFilters({})).toEqual({});
  });

  it("when given a partial activeFilters, should return the partial object", () => {
    expect(getActiveFilters({status: "draft"})).toEqual({status: "draft"});
  });
});
