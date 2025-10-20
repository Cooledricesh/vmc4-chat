'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { RegisterInput, RegisterResponse } from '../lib/dto';
import { useToast } from '@/hooks/use-toast';

export function useRegister() {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<RegisterResponse> => {
      const response = await apiClient.post('/api/auth/register', data);
      return response.data;
    },

    onSuccess: () => {
      toast({
        title: '회원가입 완료',
        description: '회원가입이 완료되었습니다. 로그인해주세요.',
      });

      // 로그인 페이지로 리디렉션
      router.push('/login');
    },

    onError: (error: unknown) => {
      console.error('Registration failed:', extractApiErrorMessage(error));
    },
  });
}
