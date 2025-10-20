'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { apiClient } from '@/lib/remote/api-client';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      // 로그아웃 API 호출 (쿠키 삭제)
      await apiClient.post('/api/auth/logout');
    },

    onSuccess: () => {
      // 전역 상태 초기화
      logout();

      // React Query 캐시 초기화
      queryClient.clear();

      // 로그인 페이지로 리디렉션
      router.push('/login');
    },

    onError: () => {
      // 에러가 발생해도 로컬 로그아웃 처리
      logout();
      queryClient.clear();
      router.push('/login');
    },
  });
}
