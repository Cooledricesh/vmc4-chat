'use client';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={isPending} className="w-full">
      {isPending ? '로그아웃 중...' : '로그아웃'}
    </Button>
  );
}
