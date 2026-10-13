import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';

import { getEndDate, getStartDate } from './helper.ts';
import { ViewTripPage } from './ViewTripPage';
import { CreateNewTripPage } from '../CreateNewTrip/CreateNewTripPage';

import type { TripFormData } from '../CreateNewTrip/CreateNewTripPage';

test.describe('Trip Activity Data', () => {
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
    // Initialize the ViewTripPage
    viewTripPage = new ViewTripPage(page);

    // Navigate to the trip page
    await viewTripPage.goto(tripId);
  });

  test('should remove the draft badge once a draft activity is completed', async ({ page }) => {
    // This test has to stay first: the trip must not contain any other activity, see the last test of this file
    const activityName = 'Cooking class';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 1);
    await viewTripPage.addDraftActivity({ name: activityName });

    const card = viewTripPage.getActivityCard(activityName);
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();

    // Open the edit form, it should be prefilled with the draft
    await viewTripPage.clickActivityMenuItem(activityName, 'Edit');
    const dialog = page.getByRole('dialog', { name: 'Edit Activity' });
    await expect(dialog.getByLabel('Name')).toHaveValue(activityName);

    // Fill in the fields required for a planned activity
    await viewTripPage.selectDatePickerValue('activity-start-date', startDate);
    await viewTripPage.selectDatePickerValue('activity-end-date', endDate);
    await dialog.getByLabel('Address').fill('Via del Corso, Rome, Italy');
    await dialog.getByRole('textbox', { name: 'Destination' }).click();
    await page.getByRole('option').first().click();
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    // Verify the activity is not a draft anymore
    await expect(dialog).toBeHidden();
    await expect(card.getByText('Draft', { exact: true })).toHaveCount(0);
    await expect(card.getByText('Not Set')).toHaveCount(0);
    await expect(card.getByText(dayjs(startDate).format('MMM D, YYYY'))).toBeVisible();
    await expect(card.getByRole('link', { name: 'Via del Corso, Rome, Italy' })).toBeVisible();
  });

  test('should display the details of a planned activity', async () => {
    const activityName = 'Visit the Louvre';
    const startDate = getStartDate(tripData.startDate);
    const endDate = getEndDate(startDate, 1);
    await viewTripPage.addActivity({
      name: activityName,
      startDate,
      endDate,
      destinationName: 'Paris',
      address: 'Louvre Museum, Paris, France',
      description: 'See the Mona Lisa and other famous artworks',
    });

    const card = viewTripPage.getActivityCard(activityName);
    await expect(card).toBeVisible();

    // Verify the dates, description and address are displayed
    await expect(card.getByText(dayjs(startDate).format('MMM D, YYYY'))).toBeVisible();
    await expect(card.getByText(dayjs(endDate).format('MMM D, YYYY'))).toBeVisible();
    await expect(card.getByText('See the Mona Lisa and other famous artworks')).toBeVisible();
    await expect(card.getByText('Not Set')).toHaveCount(0);

    // Verify the address links to a map
    const addressLink = card.getByRole('link', { name: 'Louvre Museum, Paris, France' });
    await expect(addressLink).toBeVisible();
    await expect(addressLink).toHaveAttribute('href', /query=Louvre Museum, Paris, France/);

    // Verify a planned activity is not flagged as a draft
    await expect(card.getByText('Draft', { exact: true })).toHaveCount(0);
  });

  test('should display a draft activity with the draft badge and no dates', async () => {
    const activityName = 'Maybe a boat tour';
    await viewTripPage.addDraftActivity({ name: activityName, description: 'To be confirmed' });

    const card = viewTripPage.getActivityCard(activityName);
    await expect(card).toBeVisible();

    // Verify the draft badge is displayed
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();

    // Verify both dates are displayed as not set
    await expect(card.getByText('Not Set')).toHaveCount(2);
    await expect(card.getByText('To be confirmed')).toBeVisible();
    await expect(card.getByRole('link')).toHaveCount(0);
  });

  test('should keep the activity when the edit form is cancelled', async ({ page }) => {
    const activityName = 'Wine tasting';
    await viewTripPage.addDraftActivity({ name: activityName });
    await expect(viewTripPage.getActivityCard(activityName)).toBeVisible();

    await viewTripPage.clickActivityMenuItem(activityName, 'Edit');
    const dialog = page.getByRole('dialog', { name: 'Edit Activity' });
    await dialog.getByLabel('Name').fill('Renamed activity');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Verify nothing changed
    await expect(dialog).toBeHidden();
    await expect(viewTripPage.getActivityCard(activityName)).toBeVisible();
    await expect(viewTripPage.getActivityCard('Renamed activity')).toHaveCount(0);
  });

  test('should delete an activity after confirmation', async ({ page }) => {
    const activityName = 'Activity to delete';
    await viewTripPage.addDraftActivity({ name: activityName });

    const card = viewTripPage.getActivityCard(activityName);
    await expect(card).toBeVisible();

    // Cancelling the confirmation keeps the activity
    await viewTripPage.clickActivityMenuItem(activityName, 'Delete');
    const dialog = page.getByRole('dialog', { name: 'Delete Activity' });
    await expect(dialog.getByText('This action cannot be undone.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(card).toBeVisible();

    // Confirming deletes it
    await viewTripPage.clickActivityMenuItem(activityName, 'Delete');
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(card).toHaveCount(0);
  });

  test('should close the edit form when the saved activity moves in the list', async ({ page }) => {
    // FIXME: known bug, the edit form stays open with its buttons loading when saving moves the activity
    // to another position in the list (sorted by start date). Remove this annotation once it is fixed.
    test.fail();

    const activityName = 'Activity moving down the list';
    const earlierDate = dayjs(tripData.startDate).add(20, 'day').format('YYYY-MM-DD');
    const laterDate = dayjs(tripData.startDate).add(25, 'day').format('YYYY-MM-DD');

    // The draft has no start date, so it is listed before the planned activity
    await viewTripPage.addActivity({
      name: 'Activity staying in place',
      startDate: earlierDate,
      endDate: earlierDate,
      destinationName: 'Paris',
      address: 'Eiffel Tower, Paris, France',
    });
    await expect(viewTripPage.getActivityCard('Activity staying in place')).toBeVisible();
    await viewTripPage.addDraftActivity({ name: activityName });
    await expect(viewTripPage.getActivityCard(activityName)).toBeVisible();

    // Completing the draft with a later start date moves it after the planned activity
    await viewTripPage.clickActivityMenuItem(activityName, 'Edit');
    const dialog = page.getByRole('dialog', { name: 'Edit Activity' });
    await viewTripPage.selectDatePickerValue('activity-start-date', laterDate);
    await viewTripPage.selectDatePickerValue('activity-end-date', laterDate);
    await dialog.getByLabel('Address').fill('Colosseum, Rome, Italy');
    await dialog.getByRole('textbox', { name: 'Destination' }).click();
    await page.getByRole('option').first().click();
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(dialog).toBeHidden();
  });
});
