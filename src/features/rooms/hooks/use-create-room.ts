'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CreateRoomInput, CreateRoomResponse } from '@/features/rooms/lib/dto';

export function useCreateRoom() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomInput): Promise<CreateRoomResponse> => {
      const response = await apiClient.post('/api/rooms', data);
      return response.data;
    },

    onSuccess: (data) => {
      // 채팅방 목록 무효화 (자동 리페치)
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      // 생성된 채팅방으로 이동
      if (data.room) {
        router.push(`/room/${data.room.id}`);
      }
    },

    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error);
      console.error('Create room failed:', message);
      alert(message || '채팅방 생성에 실패했습니다.');
    },
  });
}
