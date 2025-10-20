'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { apiClient } from '@/lib/remote/api-client';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  const query = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      console.log('Fetching user from server...');
      const response = await apiClient.get('/api/users/me');
      console.log('Server response:', response.data);
      console.log('Full response structure:', JSON.stringify(response.data, null, 2));

      // 응답 구조 확인: response.data에 바로 user가 있는지, data.user가 있는지
      const userData = response.data.data?.user || response.data.user;

      if (!userData) {
        console.error('User data not found in response:', response.data);
        throw new Error('Invalid response structure');
      }

      console.log('Extracted user data:', userData);
      return userData;
    },
    enabled: isAuthenticated,
    staleTime: 0, // 캐시 비활성화 - 항상 최신 데이터 가져오기
    refetchOnMount: 'always', // 마운트될 때마다 항상 다시 가져오기
  });

  // 서버에서 데이터를 가져오면 store 업데이트
  useEffect(() => {
    if (query.data) {
      console.log('Fetched user from server:', query.data);
      console.log('Current store user before update:', useAuthStore.getState().user);

      updateUser({
        id: query.data.id,
        email: query.data.email,
        nickname: query.data.nickname,
      });

      console.log('Current store user after update:', useAuthStore.getState().user);
    }
  }, [query.data, updateUser]);

  return query;
}
