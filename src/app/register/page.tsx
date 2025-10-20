'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { RegisterHeader } from '@/features/auth/components/RegisterHeader';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { RegisterFooter } from '@/features/auth/components/RegisterFooter';

type RegisterPageProps = {
  params: Promise<Record<string, never>>;
};

export default function RegisterPage({ params }: RegisterPageProps) {
  void params;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <RegisterHeader />
        <RegisterForm />
        <RegisterFooter />
      </div>
    </div>
  );
}
