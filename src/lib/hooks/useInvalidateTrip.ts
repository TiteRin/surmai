import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Refreshes the trip along with the attachments and expenses shared by its transportations, lodgings and activities
export const useInvalidateTrip = (tripId?: string) => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] }),
      queryClient.invalidateQueries({ queryKey: ['getTripAttachments', tripId] }),
      queryClient.invalidateQueries({ queryKey: ['listExpenses', tripId] }),
    ]);
  }, [queryClient, tripId]);
};
