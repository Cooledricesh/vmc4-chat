'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { apiClient } from '@/lib/remote/api-client';
import type { NicknameChangeInput } from '../lib/dto';

export function useChangeNickname() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (data: NicknameChangeInput) => {
      const response = await apiClient.patch('/api/users/me/nickname', data);

      console.log('Nickname change raw response:', response.data);

      // 응답 데이터 확인 - GET /me와 동일한 형식 {user: {...}}
      if (!response.data) {
        throw new Error('잘못된 응답 형식입니다');
      }

      // response.data.data.user 또는 response.data.user 처리
      return response.data.data || response.data;
    },

    // Optimistic Update: 서버 응답 전에 즉시 UI 업데이트
    onMutate: async (newData) => {
      console.log('Optimistic update - new nickname:', newData.nickname);

      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: ['user', 'me'] });

      // 이전 값 저장 (rollback용)
      const previousUser = queryClient.getQueryData(['user', 'me']);

      // Optimistic update: 즉시 캐시 업데이트
      if (user) {
        const updatedUser = {
          ...user,
          nickname: newData.nickname,
        };

        // React Query 캐시 즉시 업데이트
        queryClient.setQueryData(['user', 'me'], updatedUser);

        // Zustand store도 즉시 업데이트
        updateUser({ nickname: newData.nickname });

        console.log('Optimistically updated user to:', updatedUser);
      }

      // rollback을 위해 이전 데이터 반환
      return { previousUser };
    },

    onSuccess: (data) => {
      console.log('Nickname change response:', data);
      console.log('Response data structure:', JSON.stringify(data, null, 2));

      // 응답 데이터가 없는 경우
      if (!data) {
        console.error('No data in response');
        return; // throw 대신 return - 이미 optimistic update로 UI는 업데이트됨
      }

      // data.user 또는 data 자체가 user일 수 있음
      const userData = data.user || data;

      // 응답 데이터 검증
      if (!userData || !userData.nickname) {
        console.error('Invalid response data:', data);
        console.log('Keeping optimistic update');
        return; // throw 대신 return
      }

      console.log('Server confirmed nickname:', userData.nickname);

      // 서버 응답으로 최종 업데이트
      const finalUser = {
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
      };

      // React Query 캐시 업데이트
      queryClient.setQueryData(['user', 'me'], finalUser);

      // Zustand store 업데이트
      updateUser(finalUser);
    },

    onError: (error, newData, context) => {
      console.error('Nickname change failed, rolling back...');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));

      // axios 에러인 경우 상세 정보 출력
      if ((error as any)?.response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }

      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousUser) {
        queryClient.setQueryData(['user', 'me'], context.previousUser);
        if (user && context.previousUser) {
          updateUser(context.previousUser as any);
        }
      }
    },

    // 성공/실패 후 항상 refetch하여 서버 데이터와 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
