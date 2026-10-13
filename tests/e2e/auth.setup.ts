import { expect, test as setup } from '@playwright/test';
import * as path from 'path';

const __dirname = import.meta.dirname;
const storageState = path.join(__dirname, '../playwright/.auth/user.json');

const backendUrl = process.env.PLAYWRIGHT_TEST_BACKEND || 'http://127.0.0.1:8060';
const email = 'admin@test.surmai.app';
const password = 'uf3u2uo3f3uuo23#$#WAIT';

// Traveller profiles the specs can assign to a trip
const travellerProfiles = [
  { legalName: 'John Doe', email: 'john.doe@test.surmai.app' },
  { legalName: 'Jane Smith', email: 'jane.smith@test.surmai.app' },
  { legalName: 'Test User', email: 'test.user@test.surmai.app' },
];

setup('seed traveller profiles', async ({ request }) => {
  const authResponse = await request.post(`${backendUrl}/api/collections/users/auth-with-password`, {
    data: { identity: email, password },
  });
  expect(authResponse.ok()).toBeTruthy();
  const { token, record } = await authResponse.json();
  const headers = { Authorization: token };
  const profilesUrl = `${backendUrl}/api/collections/traveller_profiles/records`;

  const listResponse = await request.get(profilesUrl, { headers, params: { perPage: 200 } });
  expect(listResponse.ok()).toBeTruthy();
  const existingEmails = (await listResponse.json()).items.map((p: { email: string }) => p.email);

  // The test database is kept between runs, only create what is missing
  for (const profile of travellerProfiles) {
    if (existingEmails.includes(profile.email)) continue;
    const createResponse = await request.post(profilesUrl, { headers, data: { ...profile, ownerId: record.id } });
    expect(createResponse.ok()).toBeTruthy();
  }
});

setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto(`/login`);

  // Fill in the login form
  await page.getByTestId('email').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  // Submit the form
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for navigation to complete and ensure we're logged in
  await page.waitForURL(`/`);

  // Save the authentication state to the specified file
  if (storageState) {
    await page.context().storageState({ path: storageState as string });
  }

  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Datasets' }).click();
  await page.waitForTimeout(1000);

  const loadAirportsLocator = page.getByRole('button', { name: 'Load Airports' });
  const airportsLocatorCount = await loadAirportsLocator.count();
  if (airportsLocatorCount > 0) {
    await loadAirportsLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(5000);
  }

  const loadPlacesLocator = page.getByRole('button', { name: 'Load Places' });
  const placesLocatorCount = await loadPlacesLocator.count();
  if (placesLocatorCount > 0) {
    await loadPlacesLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(50000);
  }

  const loadAirlinesLocator = page.getByRole('button', { name: 'Load Airlines' });
  const loadAirlinesLocatorCount = await loadAirlinesLocator.count();
  if (loadAirlinesLocatorCount > 0) {
    await loadAirlinesLocator.click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForTimeout(5000);
  }
});
