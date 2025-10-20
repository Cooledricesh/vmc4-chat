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

      // 응답 데이터 확인
      if (!response.data || !response.data.data) {
        throw new Error('잘못된 응답 형식입니다');
      }

      return response.data.data;
    },

    onSuccess: (data) => {
      // 응답 데이터 검증
      if (!data.user || !data.user.nickname) {
        console.error('Invalid response data:', data);
        throw new Error('응답 데이터가 올바르지 않습니다');
      }

      // 전역 상태 업데이트
      updateUser({
        nickname: data.user.nickname,
        email: data.user.email,
        id: data.user.id,
      });

      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
