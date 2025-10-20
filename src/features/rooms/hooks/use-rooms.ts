'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { Room } from '@/features/rooms/lib/dto';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async (): Promise<Room[]> => {
      const response = await apiClient.get('/api/rooms');
      return response.data.rooms || [];
    },
    refetchInterval: 5000, // 5초마다 자동 갱신
  });
}
