import { pb } from './pocketbase.ts';
import { ActivityCategory } from '../../../types/trips.ts';

const activity_categories = pb.collection('activity_categories');
export const listActivityCategories = async (): Promise<ActivityCategory[]> => {
  const response = await activity_categories
    .getList<ActivityCategory>(1, 100, {
      sort: 'order',
    });

  return response.items;
};