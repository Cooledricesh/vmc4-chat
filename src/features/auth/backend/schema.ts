import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type LoginInput = z.infer<typeof loginSchema>;

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
});

export const loginResponseSchema = z.object({
  user: userSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
