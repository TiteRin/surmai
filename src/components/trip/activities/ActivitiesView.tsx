import { ActivitiesPanel } from './ActivitiesPanel.tsx';
import type { Trip, Attachment, Expense, TravellerProfile } from '../../../types/trips.ts';

type ActivitiesViewProps = {
  trip: Trip;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
  tripTravellers?: TravellerProfile[];
  refetchTrip: () => void;
};

export const ActivitiesView = ({
  trip,
  tripAttachments,
  expenseMap,
  tripTravellers = [],
  refetchTrip,
}: ActivitiesViewProps) => {
  return (
    <>
      <ActivitiesPanel
        trip={trip}
        tripAttachments={tripAttachments}
        expenseMap={expenseMap}
        tripTravellers={tripTravellers}
        refetchTrip={refetchTrip}
      />
    </>
  );
};
