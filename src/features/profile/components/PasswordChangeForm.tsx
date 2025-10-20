'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordChangeSchema } from '@/features/profile/lib/dto';
import { useChangePassword } from '@/features/profile/hooks/use-change-password';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function PasswordChangeForm() {
  const { mutate: changePassword, isPending } = useChangePassword();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
  });

  const onSubmit = (data: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
  }) => {
    if (!data.currentPassword || !data.newPassword || !data.newPasswordConfirm) {
      toast({ variant: 'destructive', title: '모든 필드를 입력해주세요' });
      return;
    }

    changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        newPasswordConfirm: data.newPasswordConfirm,
      },
      {
        onSuccess: () => {
          toast({ title: '비밀번호가 변경되었습니다' });
          reset();
        },
        onError: (error: any) => {
          const errorCode = error?.response?.data?.error?.code;
          if (errorCode === 'INVALID_PASSWORD') {
            toast({ variant: 'destructive', title: '기존 비밀번호가 일치하지 않습니다' });
          } else {
            toast({ variant: 'destructive', title: '비밀번호 변경에 실패했습니다' });
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword">기존 비밀번호</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          {...register('currentPassword')}
          disabled={isPending}
        />
        {errors.currentPassword && (
          <p className="text-red-600 text-sm mt-1">{errors.currentPassword.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="최소 8자 이상"
          {...register('newPassword')}
          disabled={isPending}
        />
        {errors.newPassword && (
          <p className="text-red-600 text-sm mt-1">{errors.newPassword.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="newPasswordConfirm">새 비밀번호 확인</Label>
        <PasswordInput
          id="newPasswordConfirm"
          autoComplete="new-password"
          placeholder="새 비밀번호 재입력"
          {...register('newPasswordConfirm')}
          disabled={isPending}
        />
        {errors.newPasswordConfirm && (
          <p className="text-red-600 text-sm mt-1">{errors.newPasswordConfirm.message as string}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
