import { listActivityCategories } from '@/src/lib/api';
import { useQuery } from '@tanstack/react-query';

export const useActivityCategories = () => {

  const { data, isError, isPending } = useQuery({
    queryKey: ['activity_categories']
    ,
    queryFn: listActivityCategories,
  });

  return {
    categories : data || [],
    isPending,
    isError,
  };
};
