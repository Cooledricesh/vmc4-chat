'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { LoginInput, LoginResponse } from '../lib/dto';

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (data: LoginInput): Promise<LoginResponse> => {
      console.log('[useLogin] Sending login request:', { email: data.email });
      const response = await apiClient.post('/api/auth/login', data);
      console.log('[useLogin] Login response:', response.data);
      return response.data;
    },

    onSuccess: (data) => {
      console.log('[useLogin] onSuccess called with data:', data);

      // 전역 상태에 사용자 정보 저장
      if (data.user) {
        console.log('[useLogin] User data exists, logging in...');
        login({
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.nickname,
        });

        // 리디렉션 URL 확인 및 이동
        const redirectParam = searchParams.get('redirect');
        const redirect = redirectParam && redirectParam.trim() !== '' ? redirectParam : '/';
        console.log('[useLogin] Redirecting to:', redirect);

        // 쿠키가 설정된 후 페이지 전체 새로고침으로 리다이렉션
        // 이렇게 해야 middleware가 실행되고 서버에서 인증 상태를 확인할 수 있음
        window.location.href = redirect;
      } else {
        console.error('[useLogin] No user data in response!');
      }
    },

    onError: (error: unknown) => {
      console.error('[useLogin] Login failed:', extractApiErrorMessage(error));
      console.error('[useLogin] Full error:', error);
    },
  });
}
