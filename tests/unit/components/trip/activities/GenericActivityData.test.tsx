import { MantineProvider } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../../../../../src/auth/AuthContext';
import { GenericActivityData } from '../../../../../src/components/trip/activities/GenericActivityData';
import * as api from '../../../../../src/lib/api';
import { showDeleteNotification } from '../../../../../src/lib/notifications';

import type { User } from '../../../../../src/types/auth';
import type { Activity, Attachment, Expense, TravellerProfile, Trip } from '../../../../../src/types/trips';

dayjs.extend(localizedFormat);

// Mock the API module
vi.mock('../../../../../src/lib/api', () => ({
  deleteActivity: vi.fn(),
  deleteActivityAttachments: vi.fn(),
  getAttachmentUrl: vi.fn(),
}));

// Mock the notifications module
vi.mock('../../../../../src/lib/notifications', () => ({
  showDeleteNotification: vi.fn(),
}));

// Mock the i18next module
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_: string, fallback: string) => fallback,
  }),
}));

// Mock the confirmation modals so that the callbacks can be triggered from the tests
vi.mock('@mantine/modals', () => ({
  openConfirmModal: vi.fn(),
  openContextModal: vi.fn(),
}));

// Mock the edit form, it is covered by its own tests
vi.mock('../../../../../src/components/trip/activities/GenericActivityForm', () => ({
  GenericActivityForm: ({
    activity,
    exitingAttachments,
    onSuccess,
    onCancel,
  }: {
    activity: Activity;
    exitingAttachments?: Attachment[];
    onSuccess: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="activity-form">
      <span>{`Editing ${activity.name}`}</span>
      <span data-testid="form-attachments">{(exitingAttachments || []).map((a) => a.name).join(',')}</span>
      <button onClick={onSuccess}>Form Success</button>
      <button onClick={onCancel}>Form Cancel</button>
    </div>
  ),
}));

const trip = {
  id: 'trip-1',
  ownerId: 'user-1',
  name: 'Test Trip',
  startDate: '2026-06-01T00:00:00',
  endDate: '2026-06-30T00:00:00',
  canUpdate: true,
} as Trip;

const plannedActivity = {
  id: 'activity-1',
  name: 'Visit the Louvre',
  description: 'See the Mona Lisa',
  address: 'Louvre Museum, Paris',
  startDate: '2026-06-10T09:30:00',
  endDate: '2026-06-10T12:00:00',
  status: 'planned',
  trip: 'trip-1',
} as Activity;

const draftActivity = {
  id: 'activity-2',
  name: 'Maybe a boat tour',
  description: '',
  status: 'draft',
  trip: 'trip-1',
} as Activity;

const tripAttachments: Attachment[] = [
  { id: 'att-1', name: 'ticket.pdf', file: 'ticket_abc.pdf' },
  { id: 'att-2', name: 'other.png', file: 'other_abc.png' },
];

const tripTravellers = [
  { id: 'traveller-1', email: 'jane@example.com', legalName: 'Jane Doe' },
  { id: 'traveller-2', email: 'john@example.com', legalName: 'John Doe' },
] as TravellerProfile[];

const renderActivity = (
  props: Partial<React.ComponentProps<typeof GenericActivityData>> = {},
  user: User | undefined = { timeFormat: '24' } as User
) => {
  const refetch = vi.fn();
  const result = render(
    <MantineProvider env="test">
      <MemoryRouter>
        <AuthContext.Provider value={{ user }}>
          <GenericActivityData
            trip={trip}
            activity={plannedActivity}
            refetch={refetch}
            expenseMap={new Map<string, Expense>()}
            {...props}
          />
        </AuthContext.Provider>
      </MemoryRouter>
    </MantineProvider>
  );
  return { ...result, refetch };
};

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTitle('Menu'));
};

// Returns the element holding the value displayed under one of the column labels
const getColumn = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('GenericActivityData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.deleteActivity as any).mockResolvedValue(undefined);
    (api.deleteActivityAttachments as any).mockResolvedValue(undefined);
  });

  describe('display', () => {
    it('renders the activity name, description and column labels', () => {
      renderActivity();

      expect(screen.getByRole('heading', { name: 'Visit the Louvre' })).toBeInTheDocument();
      expect(screen.getByText('See the Mona Lisa')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('renders the start and end dates with the user time format', () => {
      renderActivity();

      const start = within(getColumn('Start Date'));
      expect(start.getByText('Jun 10, 2026')).toBeInTheDocument();
      expect(start.getByText('09:30')).toBeInTheDocument();

      const end = within(getColumn('End Date'));
      expect(end.getByText('Jun 10, 2026')).toBeInTheDocument();
      expect(end.getByText('12:00')).toBeInTheDocument();
    });

    it('renders the times in 12 hours format when the user prefers it', () => {
      renderActivity({}, { timeFormat: '12' } as User);

      expect(within(getColumn('Start Date')).getByText('9:30 AM')).toBeInTheDocument();
      expect(within(getColumn('End Date')).getByText('12:00 PM')).toBeInTheDocument();
    });

    it('renders "Not Set" when the dates are missing', () => {
      renderActivity({ activity: draftActivity });

      expect(within(getColumn('Start Date')).getByText('Not Set')).toBeInTheDocument();
      expect(within(getColumn('End Date')).getByText('Not Set')).toBeInTheDocument();
    });

    it('renders "Not Set" only for the missing date', () => {
      renderActivity({ activity: { ...draftActivity, startDate: '2026-06-10T09:30:00' } as Activity });

      expect(within(getColumn('Start Date')).getByText('Jun 10, 2026')).toBeInTheDocument();
      expect(within(getColumn('Start Date')).queryByText('Not Set')).not.toBeInTheDocument();
      expect(within(getColumn('End Date')).getByText('Not Set')).toBeInTheDocument();
    });
  });

  describe('draft status', () => {
    it('shows the draft badge for a draft activity', () => {
      renderActivity({ activity: draftActivity });

      expect(screen.getByRole('heading', { name: 'Maybe a boat tour' })).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('does not show the draft badge for a planned activity', () => {
      renderActivity();

      expect(screen.queryByText('Draft')).not.toBeInTheDocument();
    });
  });

  describe('address', () => {
    it('links the address to OpenStreetMap by default', () => {
      renderActivity();

      const link = screen.getByRole('link', { name: 'Louvre Museum, Paris' });
      expect(link).toHaveAttribute('href', 'https://www.openstreetmap.org/search?query=Louvre Museum, Paris');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('links the address to Google Maps when it is the user maps provider', () => {
      renderActivity({}, { mapsProvider: 'google' } as User);

      expect(screen.getByRole('link', { name: 'Louvre Museum, Paris' })).toHaveAttribute(
        'href',
        'https://www.google.com/maps/search/?api=1&query=Louvre Museum, Paris'
      );
    });

    it('does not render a link when there is no address', () => {
      renderActivity({ activity: draftActivity });

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('cost', () => {
    const expense = { id: 'expense-1', name: 'Louvre', trip: 'trip-1', cost: { value: 42.5, currency: 'EUR' } } as Expense;
    const expectedCost = (42.5).toLocaleString(undefined, { style: 'currency', currency: 'EUR' });

    it('renders the cost of the linked expense', () => {
      renderActivity({
        activity: { ...plannedActivity, expenseId: 'expense-1' } as Activity,
        expenseMap: new Map([['expense-1', expense]]),
      });

      // Compare the raw text, the formatted cost may contain non-breaking spaces depending on the locale
      expect(getColumn('Cost').lastElementChild?.textContent).toBe(expectedCost);
    });

    it('renders no cost when the activity has no expense', () => {
      renderActivity({ expenseMap: new Map([['expense-1', expense]]) });

      expect(getColumn('Cost').lastElementChild).toBeEmptyDOMElement();
    });

    it('renders no cost when the expense is not in the map', () => {
      renderActivity({ activity: { ...plannedActivity, expenseId: 'unknown' } as Activity });

      expect(getColumn('Cost').lastElementChild).toBeEmptyDOMElement();
    });
  });

  describe('travellers', () => {
    it('renders only the travellers attached to the activity', () => {
      renderActivity({
        activity: { ...plannedActivity, travellers: ['traveller-1'] } as Activity,
        tripTravellers,
      });

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('renders no travellers when the activity has none', () => {
      renderActivity({ tripTravellers });

      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('attachments', () => {
    it('renders only the attachments referenced by the activity', () => {
      renderActivity({
        activity: { ...plannedActivity, attachmentReferences: ['att-1'] } as Activity,
        tripAttachments,
      });

      expect(screen.getByText('ticket.pdf')).toBeInTheDocument();
      expect(screen.queryByText('other.png')).not.toBeInTheDocument();
    });

    it('renders no attachments when the activity references none', () => {
      renderActivity({ tripAttachments });

      expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('other.png')).not.toBeInTheDocument();
    });

    it('deletes an attachment and refetches after confirmation', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity({
        activity: { ...plannedActivity, attachmentReferences: ['att-1'] } as Activity,
        tripAttachments,
      });

      await user.click(screen.getByTitle('Delete Attachment'));
      expect(openConfirmModal).toHaveBeenCalledTimes(1);
      expect(api.deleteActivityAttachments).not.toHaveBeenCalled();

      vi.mocked(openConfirmModal).mock.calls[0][0].onConfirm?.();

      expect(api.deleteActivityAttachments).toHaveBeenCalledWith('activity-1', 'att-1');
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    });
  });

  describe('menu', () => {
    it('shows the edit and delete actions', async () => {
      const user = userEvent.setup();
      renderActivity();

      await openMenu(user);

      expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeEnabled();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled();
      expect(screen.queryByRole('menuitem', { name: 'View Link' })).not.toBeInTheDocument();
    });

    it('shows the link action when the activity has a link', async () => {
      const user = userEvent.setup();
      renderActivity({ activity: { ...plannedActivity, link: 'https://www.louvre.fr' } as Activity });

      await openMenu(user);

      expect(await screen.findByRole('menuitem', { name: 'View Link' })).toBeInTheDocument();
    });

    it('disables the edit and delete actions when the trip cannot be updated', async () => {
      const user = userEvent.setup();
      renderActivity({ trip: { ...trip, canUpdate: false } as Trip });

      await openMenu(user);

      expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeDisabled();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
    });
  });

  describe('edit', () => {
    const openEditForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await openMenu(user);
      await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
      return screen.findByTestId('activity-form');
    };

    it('does not render the form until edit is clicked', () => {
      renderActivity();

      expect(screen.queryByTestId('activity-form')).not.toBeInTheDocument();
    });

    it('opens the edit form with the activity and its attachments', async () => {
      const user = userEvent.setup();
      renderActivity({
        activity: { ...plannedActivity, attachmentReferences: ['att-1'] } as Activity,
        tripAttachments,
      });

      const form = await openEditForm(user);

      expect(screen.getByText('Edit Activity')).toBeInTheDocument();
      expect(within(form).getByText('Editing Visit the Louvre')).toBeInTheDocument();
      expect(within(form).getByTestId('form-attachments')).toHaveTextContent('ticket.pdf');
    });

    it('closes the form and refetches when the form succeeds', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity();

      await openEditForm(user);
      await user.click(screen.getByRole('button', { name: 'Form Success' }));

      expect(refetch).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByTestId('activity-form')).not.toBeInTheDocument());
    });

    it('closes the form without refetching when the form is cancelled', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity();

      await openEditForm(user);
      await user.click(screen.getByRole('button', { name: 'Form Cancel' }));

      expect(refetch).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByTestId('activity-form')).not.toBeInTheDocument());
    });
  });

  describe('delete', () => {
    const clickDelete = async (user: ReturnType<typeof userEvent.setup>) => {
      await openMenu(user);
      await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
      return vi.mocked(openConfirmModal).mock.calls[0][0];
    };

    it('asks for confirmation before deleting', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity();

      const modal = await clickDelete(user);

      expect(openConfirmModal).toHaveBeenCalledTimes(1);
      expect(modal.title).toBe('Delete Activity');
      expect(modal.labels).toEqual({ confirm: 'Delete', cancel: 'Cancel' });
      expect(api.deleteActivity).not.toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
    });

    it('deletes the activity, notifies and refetches when confirmed', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity();

      const modal = await clickDelete(user);
      modal.onConfirm?.();

      expect(api.deleteActivity).toHaveBeenCalledWith('activity-1');
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
      expect(showDeleteNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Activity' }));
    });

    it('does not delete the activity when cancelled', async () => {
      const user = userEvent.setup();
      const { refetch } = renderActivity();

      const modal = await clickDelete(user);
      modal.onCancel?.();

      expect(api.deleteActivity).not.toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
    });
  });
});
