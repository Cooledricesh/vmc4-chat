'use client';

import { LoginHeader } from '@/features/auth/components/LoginHeader';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoginFooter } from '@/features/auth/components/LoginFooter';

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </div>
    </div>
  );
}
