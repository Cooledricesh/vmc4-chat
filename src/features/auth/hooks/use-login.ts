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
      const response = await apiClient.post('/api/auth/login', data);
      return response.data;
    },

    onSuccess: (data) => {
      // 전역 상태에 사용자 정보 저장
      if (data.user) {
        login({
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.nickname,
        });

        // 리디렉션 URL 확인 및 이동
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    },

    onError: (error: unknown) => {
      console.error('Login failed:', extractApiErrorMessage(error));
    },
  });
}
