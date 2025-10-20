'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../lib/dto';
import { useRegister } from '../hooks/use-register';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

export function RegisterForm() {
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{extractApiErrorMessage(error)}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            {...registerField('email')}
            disabled={isPending}
            autoFocus
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">비밀번호</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="최소 8자 이상"
            {...registerField('password')}
            disabled={isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
          <PasswordInput
            id="passwordConfirm"
            autoComplete="new-password"
            placeholder="비밀번호 재입력"
            {...registerField('passwordConfirm')}
            disabled={isPending}
          />
          {errors.passwordConfirm && (
            <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            type="text"
            autoComplete="off"
            placeholder="닉네임 (1-50자)"
            maxLength={50}
            {...registerField('nickname')}
            disabled={isPending}
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? '회원가입 중...' : '회원가입'}
      </Button>
    </form>
  );
}
