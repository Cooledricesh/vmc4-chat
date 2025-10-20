'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { apiClient } from '@/lib/remote/api-client';
import type { NicknameChangeInput } from '../lib/dto';

export function useChangeNickname() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: NicknameChangeInput) => {
      const response = await apiClient.patch('/api/users/me/nickname', data);
      return response.data.data;
    },

    onSuccess: (data) => {
      // 전역 상태 업데이트
      updateUser({ nickname: data.user.nickname });
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
