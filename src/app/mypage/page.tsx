'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useCurrentUser } from '@/features/profile/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NicknameChangeForm } from '@/features/profile/components/NicknameChangeForm';
import { PasswordChangeForm } from '@/features/profile/components/PasswordChangeForm';
import { LogoutButton } from '@/features/profile/components/LogoutButton';
import { ArrowLeft } from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // 서버에서 최신 사용자 정보 가져오기
  const { data: serverUser, isLoading, error } = useCurrentUser();

  console.log('MyPage - isAuthenticated:', isAuthenticated);
  console.log('MyPage - store user:', user);
  console.log('MyPage - server user:', serverUser);
  console.log('MyPage - isLoading:', isLoading);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    console.error('Failed to fetch user:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>사용자 정보를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  // 서버 데이터가 없는 경우
  if (!serverUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>사용자 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 서버 데이터만 사용
  const displayUser = serverUser;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4 max-w-4xl">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>현재 로그인한 계정 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">이메일</p>
              <p className="text-base font-medium">{displayUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">닉네임</p>
              <p className="text-base font-medium">{displayUser.nickname}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>닉네임 변경</CardTitle>
            <CardDescription>새로운 닉네임으로 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <NicknameChangeForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>보안을 위해 주기적으로 비밀번호를 변경해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>로그아웃</CardTitle>
            <CardDescription>현재 계정에서 로그아웃합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoutButton />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
