import { z } from 'zod';

// Nickname Change Schema
export const nicknameChangeSchema = z.object({
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .max(50, '닉네임은 최대 50자까지 가능합니다'),
});

export type NicknameChangeInput = z.infer<typeof nicknameChangeSchema>;

export const nicknameChangeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
  }),
  token: z.string(),
});

export type NicknameChangeResponse = z.infer<typeof nicknameChangeResponseSchema>;

// Password Change Schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '기존 비밀번호를 입력해주세요'),
    newPassword: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['newPasswordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 기존 비밀번호와 달라야 합니다',
    path: ['newPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const passwordChangeResponseSchema = z.object({
  message: z.string(),
});

export type PasswordChangeResponse = z.infer<typeof passwordChangeResponseSchema>;
