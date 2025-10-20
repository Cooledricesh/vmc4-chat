'use client';

import { RegisterHeader } from '@/features/auth/components/RegisterHeader';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { RegisterFooter } from '@/features/auth/components/RegisterFooter';

type RegisterPageProps = {
  params: Promise<Record<string, never>>;
};

export default function RegisterPage({ params }: RegisterPageProps) {
  void params;

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
