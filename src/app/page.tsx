import { redirect } from 'next/navigation';
import { loadCurrentUser } from '@/features/auth/server/load-current-user';
import { MainPageClient } from '@/features/rooms/components/MainPageClient';

export default async function MainPage() {
  const currentUser = await loadCurrentUser();

  // 비로그인 상태면 로그인 페이지로 리디렉션
  if (currentUser.status !== 'authenticated') {
    redirect('/login');
  }

  return <MainPageClient />;
}
