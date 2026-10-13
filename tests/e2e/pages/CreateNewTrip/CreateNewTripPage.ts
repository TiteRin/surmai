import { expect } from '@playwright/test';
import dayjs from 'dayjs';

import type { Page } from '@playwright/test';

export interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  participants: string[];
}

export class CreateNewTripPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the create new trip page
   */
  async goto() {
    await this.page.goto('/trips/create');
  }

  /**
   * Check that all form elements are visible
   */
  async expectFormElementsVisible() {
    // Check basic form elements
    await expect(this.page.getByLabel('Name')).toBeVisible();
    await expect(this.page.getByLabel('Brief Description')).toBeVisible();
    await expect(this.page.getByLabel('Trip Dates')).toBeVisible();

    // Check the destination selector is visible
    await expect(this.page.getByText('Enter some basic information about your trip to get started')).toBeVisible();

    // Check the Create Trip button is visible
    await expect(this.page.getByRole('button', { name: 'Create Trip' })).toBeVisible();
  }

  /**
   * Fill the trip form with the provided data
   */
  async fillTripForm(data: TripFormData) {
    // Fill in the name
    await this.page.getByLabel('Name').fill(data.name);

    // Fill in the description if provided
    if (data.description) {
      await this.page.getByLabel('Brief Description').fill(data.description);
    }

    // Set the date range
    const startDateStr = dayjs(data.startDate).format('D MMMM YYYY');
    const endDateStr = dayjs(data.endDate).format('D MMMM YYYY');
    await this.page.click('[data-testid="trip-dates"]');
    await this.page.click(`button[aria-label="${startDateStr}"]`);
    await this.page.click(`button[aria-label="${endDateStr}"]`);

    // Add places
    for (const destination of data.destinations) {
      await this.searchAndSelectDestination(destination);
    }

    // Add participants
    // Travelers can only be picked among existing traveller profiles (seeded in auth.setup.ts)
    const travellers = this.page.getByRole('combobox', { name: 'Travelers' });
    for (const participant of data.participants) {
      await travellers.click();
      await travellers.fill(participant);
      await this.page.getByRole('option', { name: participant }).click();
    }
    if (data.participants.length > 0) {
      // Close the dropdown so it does not cover the rest of the form
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Search for and select a destination
   */
  async searchAndSelectDestination(destinationName: string) {
    // Click on the destination search field
    await this.page.getByLabel('Destinations').click();

    // Type the destination name
    await this.page.getByLabel('Destinations').fill(destinationName);

    // Wait for the search results to appear
    await this.page.waitForTimeout(500); // Small delay to allow search to complete

    // Click on the first search result
    await this.page.getByRole('option').first().click();
  }

  /**
   * Click the Create Trip button
   */
  async clickCreateTripButton() {
    await this.page.getByRole('button', { name: 'Create Trip' }).click();
  }
}
