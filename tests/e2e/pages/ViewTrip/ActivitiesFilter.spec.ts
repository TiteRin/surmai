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

  const plannedActivityName = 'Visit the Louvre';
  const draftActivityName = 'Cooking class';

  // Seed the trip through the API, the UI creation flow is covered by CreateNewTrip specs
  test.beforeAll(async ({ request }) => {
    const authResponse = await request.post(`${backendUrl}/api/collections/users/auth-with-password`, {
      data: { identity: 'admin@test.surmai.app', password: 'uf3u2uo3f3uuo23#$#WAIT' },
    });
    expect(authResponse.ok()).toBeTruthy();
    const { token, record } = await authResponse.json();

    // Traveller profiles are seeded in auth.setup.ts
    const profilesResponse = await request.get(`${backendUrl}/api/collections/traveller_profiles/records`, {
      headers: { Authorization: token },
      params: { filter: "legalName='Alice' || legalName='Bob' || legalName='Charlie'" },
    });
    expect(profilesResponse.ok()).toBeTruthy();
    const profiles: { id: string; legalName: string }[] = (await profilesResponse.json()).items;
    const travellerIds = (...names: string[]) =>
      names.map((name) => profiles.find((p) => p.legalName === name)!.id);

    const tripResponse = await request.post(`${backendUrl}/api/collections/trips/records`, {
      headers: { Authorization: token },
      data: {
        name: `Activities Test Trip ${Date.now()}`,
        description: 'Test Description for Activities tests',
        startDate: dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ssZ'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DDTHH:mm:ssZ'),
        ownerId: record.id,
        travellers: travellerIds('Alice', 'Bob', 'Charlie'),
        destinations: [
          {
            id: 'paris',
            name: 'Paris',
            countryName: 'France',
            latitude: '48.8566',
            longitude: '2.3522',
            timezone: 'Europe/Paris',
          },
          {
            id: 'rome',
            name: 'Rome',
            countryName: 'Italy',
            latitude: '41.9028',
            longitude: '12.4964',
            timezone: 'Europe/Rome',
          },
        ],
      },
    });
    expect(tripResponse.ok()).toBeTruthy();
    trip = (await tripResponse.json()) as Trip;
    tripId = trip.id;


    const activitiesUrl = `${backendUrl}/api/collections/activities/records`;
    const startDate = getStartDate(trip.startDate);
    const endDate = getEndDate(startDate, 1);
    const plannedResponse = await request.post(activitiesUrl, {
      headers: { Authorization: token },
      data: {
        trip: tripId,
        name: plannedActivityName,
        description: 'See the Mona Lisa and other famous artworks',
        address: 'Louvre Museum, Paris, France',
        startDate: dayjs(startDate).format('YYYY-MM-DDTHH:mm:ss[Z]'),
        endDate: dayjs(endDate).format('YYYY-MM-DDTHH:mm:ss[Z]'),
        status: 'planned',
        travellers: travellerIds('Bob', 'Charlie'),
        metadata: { place: trip.destinations?.find((d) => d.name === 'Paris') },
      },
    });
    expect(plannedResponse.ok()).toBeTruthy();

    const draftResponse = await request.post(activitiesUrl, {
      headers: { Authorization: token },
      data: {
        trip: tripId,
        name: draftActivityName,
        status: 'draft',
        travellers: travellerIds('Alice'),
      },
    });
    expect(draftResponse.ok()).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    viewTripPage = new ViewTripPage(page);
    await viewTripPage.goto(tripId);
    await viewTripPage.switchToTab('Activities');
  });

  test.afterEach(async ({}) => {
    viewTripPage.openActivityFilters();
    viewTripPage.resetActivityFilters();
  });

  test('should open and close the activity filters', async ({ page }) => {
    // Open the filter form
    await viewTripPage.openActivityFilters();
    const filters = page.getByRole('dialog', { name: 'Filters' });
    await expect(filters).toBeVisible();

    // Apply the filters
    await viewTripPage.applyActivityFilters();
    await expect(filters).toBeHidden();
  });

  test.describe("Filters by status", () => {

    test('should filter activities by status', async ({ page }) => {
      // Open the filter form
      await viewTripPage.openActivityFilters();
      // Select "Draft"
      await viewTripPage.setStatusFilter('Draft');
      // Apply the filters
      await viewTripPage.applyActivityFilters();

      await expect(page.getByRole('button', { name: 'Filters ' })).toContainText('1');
      await expect(viewTripPage.getActivityCard(plannedActivityName)).not.toBeVisible();
      await expect(viewTripPage.getActivityCard(draftActivityName)).toBeVisible();

      await viewTripPage.openActivityFilters();
      await viewTripPage.resetActivityFilters();

      await expect(viewTripPage.getActivityCard(plannedActivityName)).toBeVisible();
      await expect(viewTripPage.getActivityCard(draftActivityName)).toBeVisible();

      // Open the filter form
      await viewTripPage.openActivityFilters();
      // Select "Draft"
      await viewTripPage.setStatusFilter('Planned');
      // Apply the filters
      await viewTripPage.applyActivityFilters();

      await expect(page.getByRole('button', { name: 'Filters ' })).toContainText('1');
      await expect(viewTripPage.getActivityCard(plannedActivityName)).toBeVisible();
      await expect(viewTripPage.getActivityCard(draftActivityName)).not.toBeVisible();
    });

    test("should show a pill when the filter status:draft is selected", async ({ page }) => {
      // Open the filter form
      await viewTripPage.openActivityFilters();
      // Select "Draft"
      await viewTripPage.setStatusFilter('Draft');
      // Apply the filters
      await viewTripPage.applyActivityFilters();

      const filterPills = page.locator('.filter_pills');
      const pill = filterPills.getByText('Draft');

      await expect(pill).toBeVisible();
      pill.click();
      await expect(pill).not.toBeVisible();

      await expect(viewTripPage.getActivityCard(plannedActivityName)).toBeVisible();
    });
  });


  test.describe("Filters by destination", () => {
    test("should filter the activities by destination", async ({ page }) => {
      // Open the filter form
      await viewTripPage.openActivityFilters();
      const destinationBox = page.getByRole('combobox', { name: 'Destination' });

      await expect(destinationBox).toBeVisible();
      await expect(destinationBox).toHaveValue('');

      await destinationBox.click();
      await expect(page.getByRole('option', { name: 'Paris , France'})).toBeVisible();
      await page.getByRole('option', { name: 'Paris , France'}).click();

      await viewTripPage.applyActivityFilters();

      await expect(viewTripPage.getActivityCard(plannedActivityName)).toBeVisible();
      await expect(viewTripPage.getActivityCard(draftActivityName)).not.toBeVisible();

      const filterPills = page.locator('.filter_pills');
      const pill = filterPills.getByText('Paris');

      await expect(pill).toBeVisible();
      pill.click();
      await expect(pill).not.toBeVisible();
    });

    test('when clearing one pill filter, should keep the filter on the other one', async ({ page }) => {
      // Open the filter form
      await viewTripPage.openActivityFilters();
      const destinationBox = page.getByRole('combobox', { name: 'Destination' });

      await expect(destinationBox).toBeVisible();
      await expect(destinationBox).toHaveValue('');

      await destinationBox.click();
      await expect(page.getByRole('option', { name: 'Paris , France' })).toBeVisible();
      await page.getByRole('option', { name: 'Paris , France' }).click();

      await destinationBox.click();
      await expect(page.getByRole('option', { name: 'Rome , Italy' })).toBeVisible();
      await page.getByRole('option', { name: 'Rome , Italy' }).click();

      await viewTripPage.applyActivityFilters();

      const filterPills = page.locator('.filter_pills');
      await expect(filterPills.getByText('Paris')).toBeVisible();
      await expect(filterPills.getByText('Rome')).toBeVisible();

      await filterPills.getByText('Paris').click();
      await expect(filterPills.getByText('Paris')).not.toBeVisible();
      await expect(filterPills.getByText('Rome')).toBeVisible();
    });
  });

  test.describe("Filters by travelers", () => {
    test("should filter the activities by travelers", async ({ page }) => {
      // Open the filter form
      await viewTripPage.openActivityFilters();

      const travelerSelect = viewTripPage.getTravelerSelect();

      await expect(travelerSelect).toBeVisible();
      await travelerSelect.click();

      await expect(page.getByRole('option', { name: 'Alice'})).toBeVisible();
      await expect(page.getByRole('option', { name: 'Bob'})).toBeVisible();
      await expect(page.getByRole('option', { name: 'Charlie'})).toBeVisible();

      await viewTripPage.selectTraveler('Bob');
      await viewTripPage.applyActivityFilters();

      await expect(viewTripPage.getActivityCard(plannedActivityName)).toBeVisible();
      await expect(viewTripPage.getActivityCard(draftActivityName)).not.toBeVisible();

      const filterPills = page.locator('.filter_pills');
      await expect(filterPills.getByText('Bob')).toBeVisible();
    });
  });
});
