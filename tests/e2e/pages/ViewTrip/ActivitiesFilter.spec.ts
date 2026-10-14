import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';
import { ViewTripPage } from './ViewTripPage.ts';
import { getEndDate, getStartDate } from './helper.ts';
import { Trip } from '../../../../src/types/trips.ts';

const backendUrl = 'http://127.0.0.1:8060';

test.describe('Activities Filter', () => {

  let viewTripPage: ViewTripPage;
  let tripId: string;
  let trip: Trip;

  // Seed the trip through the API, the UI creation flow is covered by CreateNewTrip specs
  test.beforeAll(async ({ request }) => {
    const authResponse = await request.post(`${backendUrl}/api/collections/users/auth-with-password`, {
      data: { identity: 'admin@test.surmai.app', password: 'uf3u2uo3f3uuo23#$#WAIT' },
    });
    expect(authResponse.ok()).toBeTruthy();
    const { token, record } = await authResponse.json();

    const tripResponse = await request.post(`${backendUrl}/api/collections/trips/records`, {
      headers: { Authorization: token },
      data: {
        name: `Activities Test Trip ${Date.now()}`,
        description: 'Test Description for Activities tests',
        startDate: dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ssZ'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DDTHH:mm:ssZ'),
        ownerId: record.id,
        participants: [{ name: 'Test User' }],
        destinations: [
          { id: 'paris', name: 'Paris', countryName: 'France', latitude: '48.8566', longitude: '2.3522', timezone: 'Europe/Paris' },
          { id: 'rome', name: 'Rome', countryName: 'Italy', latitude: '41.9028', longitude: '12.4964', timezone: 'Europe/Rome' },
        ],
      },
    });
    expect(tripResponse.ok()).toBeTruthy();
    trip = (await tripResponse).json() as Trip;
    tripId = trip.id;
  });

  test.beforeEach(async ({ page }) => {
    viewTripPage = new ViewTripPage(page);
    await viewTripPage.goto(tripId);
    await viewTripPage.switchToTab('Activities');
  });

  test("should open and close the activity filters", async ({ page }) => {
    // Open the filter form
    await viewTripPage.openActivityFilters();
    const filters = page.getByRole('dialog', { name: 'Filters' });
    await expect(filters).toBeVisible();

    // Apply the filters
    await viewTripPage.applyActivityFilters();
    await expect(filters).toBeHidden();
  });

  test.fixme("should filter activities by status", async ({ }) => {

    const plannedActivityName = 'Visit the Louvre';
    const startDate = getStartDate(trip.startDate);
    const endDate = getEndDate(startDate, 1);
    await viewTripPage.addActivity({
      name: plannedActivityName,
      startDate,
      endDate,
      destinationName: 'Paris',
      address: 'Louvre Museum, Paris, France',
      description: 'See the Mona Lisa and other famous artworks',
    });

    const draftActivityName = 'Cooking class';
    await viewTripPage.addDraftActivity({ name: draftActivityName });

    // Open the filter form
    await viewTripPage.openActivityFilters();
    // Select "Draft"
    await viewTripPage.setStatusFilter("draft");
    // Apply the filters
    await viewTripPage.applyActivityFilters();

  });
});
