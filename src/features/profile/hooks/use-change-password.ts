'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PasswordChangeInput } from '../lib/dto';

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: PasswordChangeInput) => {
      const response = await apiClient.patch('/api/users/me/password', data);
      return response.data;
    },
  });
}
