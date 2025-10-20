'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRoom } from '@/features/rooms/hooks/use-create-room';
import { createRoomSchema, type CreateRoomInput } from '@/features/rooms/lib/dto';

export function CreateRoomButton() {
  const [open, setOpen] = useState(false);
  const { mutate: createRoom, isPending } = useCreateRoom();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = (data: CreateRoomInput) => {
    createRoom(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>채팅방 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 채팅방 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">채팅방 이름</Label>
            <Input
              id="name"
              placeholder="채팅방 이름 (1-100자)"
              maxLength={100}
              {...register('name')}
              disabled={isPending}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
