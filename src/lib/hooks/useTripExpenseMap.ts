import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { TRIP_DATA_STALE_TIME } from './tripData.ts';
import { listExpenses } from '../api';

import type { Expense } from '../../types/trips.ts';

export const useTripExpenseMap = (tripId?: string) => {
  const { data: expenses, isPending } = useQuery<Expense[]>({
    queryKey: ['listExpenses', tripId],
    queryFn: () => listExpenses(tripId || ''),
    staleTime: TRIP_DATA_STALE_TIME,
  });

  const expenseMap = useMemo(() => {
    const map = new Map<string, Expense>();
    expenses?.forEach((expense) => {
      map.set(expense.id, expense);
    });
    return map;
  }, [expenses]);

  return { expenseMap, isPending };
};
