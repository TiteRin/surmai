import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countActiveFilters, filterActivities } from '../../../../../src/components/trip/activities/filters.ts';
import { plannedActivity, draftActivity} from '../../../fixtures.tsx';

describe("filters", () => {

  it("when given an empty activity list, should return an empty list", () => {
      expect(filterActivities([])).toEqual([]);
  });

  it("when given no filter, should return a list with the same activities", () => {
      const activities = [
        plannedActivity, draftActivity
      ];
      expect(filterActivities(activities)).toEqual(activities);
  });

  it("should not modified the list passed in parameters (not mutable)", () => {
      const activities = [
        plannedActivity, draftActivity
      ];
      expect(filterActivities(activities)).not.toBe(activities);
  });

  describe("by status", () => {
    const activities = [plannedActivity, draftActivity];

    it ("when status is set to all, should return all activities", () => {
      expect(filterActivities(activities, { status: "all"})).toEqual(activities);
    });

    it("when status is set to draft, should only return the draft item", () => {
      expect(filterActivities(activities, { status: "draft"})).toEqual([draftActivity]);
    });

    it("when status is set to planned, should only return the planned item", () => {
      expect(filterActivities(activities, { status: "planned"})).toEqual([plannedActivity]);
    });
  });
});

describe("countActiveFilters", () => {
  it ("when given no filters, should return 0", () => {
    expect(countActiveFilters()).toBe(0);
  });

  it("when given a status:all, should return 0", () => {
    expect(countActiveFilters({status: "all"})).toBe(0);
  })

  it("when given a status different of all, should return 1", () => {
    expect(countActiveFilters({status: 'draft'})).toBe(1);
    expect(countActiveFilters({status: 'planned'})).toBe(1);
  });
});