import { expect, test } from '@playwright/test';
import { CreateNewTripPage, type TripFormData } from '../CreateNewTrip/CreateNewTripPage.ts';
import dayjs from 'dayjs';
import { ViewTripPage } from './ViewTripPage.ts';
// import { getEndDate, getStartDate } from './helper.ts';

test.describe('Activities Filter', () => {

  let viewTripPage: ViewTripPage;
  let createNewTripPage: CreateNewTripPage;
  let tripId: string;
  let tripData: TripFormData;

  test.beforeAll(async ({ browser }) => {
    // Create a new context and page for trip creation
    const context = await browser.newContext({
      storageState: 'tests/playwright/.auth/user.json',
    });
    const page = await context.newPage();

    // Initialize the CreateNewTripPage
    createNewTripPage = new CreateNewTripPage(page);

    // Navigate to the create new trip page
    await createNewTripPage.goto();

    // Create a new trip
    tripData = {
      name: `Activity Data Test Trip ${Date.now()}`,
      description: 'Test Description for Activity Data tests',
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      destinations: ['Paris, France', 'Rome, Italy'],
      participants: [],
    };

    await createNewTripPage.fillTripForm(tripData);
    await createNewTripPage.clickCreateTripButton();

    // Wait for navigation and extract the trip ID from the URL
    await page.waitForTimeout(1000);
    await page.waitForURL(/\/trips\/[^/]+$/);
    const url = page.url();
    tripId = url.split('/').pop() || '';

    // Close the context
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    viewTripPage = new ViewTripPage(page);
    await viewTripPage.goto(tripId);
    viewTripPage.switchToTab('Activities');
  });

  test.fixme("should open and close the activity filters", async ({ page }) => {
    // Open the filter form
    await viewTripPage.openActivityFilters();
    const filters = page.getByRole('dialog', { name: 'Activity Filters' });
    await expect(filters).toBeVisible();

    // Apply the filters
    await viewTripPage.applyActivityFilters();
    await expect(filters).toBeHidden();
  });

  // test.fixme("should filter activities by status", async ({ }) => {
  //
  //   const plannedActivityName = 'Visit the Louvre';
  //   const startDate = getStartDate(tripData.startDate);
  //   const endDate = getEndDate(startDate, 1);
  //   await viewTripPage.addActivity({
  //     name: plannedActivityName,
  //     startDate,
  //     endDate,
  //     destinationName: 'Paris',
  //     address: 'Louvre Museum, Paris, France',
  //     description: 'See the Mona Lisa and other famous artworks',
  //   });
  //
  //   const draftActivityName = 'Cooking class';
  //   await viewTripPage.addDraftActivity({ name: draftActivityName });
  //
  //   // Open the filter form
  //   await viewTripPage.openActivityFilters();
  //   // Select "Draft"
  //   await viewTripPage.setStatusFilter("draft");
  //   // Apply the filters
  //   await viewTripPage.applyActivityFilters();
  //
  // });
});