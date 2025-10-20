'use client';

import Link from 'next/link';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { Button } from '@/components/ui/button';

export function MainHeader() {
  const { user } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Cokaotalk</h1>
          {user && (
            <span className="text-sm text-gray-600">{user.nickname}님</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/mypage">
            <Button variant="ghost">마이페이지</Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => logout()}
            disabled={isPending}
          >
            {isPending ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </div>
      </div>
    </header>
  );
}
