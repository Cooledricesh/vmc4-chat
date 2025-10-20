'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nicknameChangeSchema } from '@/features/profile/lib/dto';
import { useChangeNickname } from '@/features/profile/hooks/use-change-nickname';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function NicknameChangeForm() {
  const { user } = useAuthStore();
  const { mutate: changeNickname, isPending } = useChangeNickname();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(nicknameChangeSchema),
    defaultValues: {
      nickname: '',
    },
  });

  const onSubmit = (data: { nickname?: string }) => {
    if (!data.nickname) {
      toast({ variant: 'destructive', title: '닉네임을 입력해주세요' });
      return;
    }

    if (data.nickname === user?.nickname) {
      toast({ variant: 'destructive', title: '현재 닉네임과 동일합니다' });
      return;
    }

    changeNickname({ nickname: data.nickname }, {
      onSuccess: () => {
        toast({ title: '닉네임이 변경되었습니다' });
        reset();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message || '닉네임 변경에 실패했습니다';
        toast({ variant: 'destructive', title: errorMessage });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm text-gray-600">현재 닉네임</Label>
        <p className="text-base font-medium">{user?.nickname}</p>
      </div>
      <div>
        <Label htmlFor="nickname">새 닉네임</Label>
        <Input
          id="nickname"
          placeholder="새 닉네임 (1-50자)"
          maxLength={50}
          {...register('nickname')}
          disabled={isPending}
        />
        {errors.nickname && (
          <p className="text-red-600 text-sm mt-1">{errors.nickname.message as string}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
