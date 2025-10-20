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

// Register Schema
export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  nickname: z.string().min(1, '닉네임을 입력해주세요').max(50, '닉네임은 최대 50자까지 가능합니다'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerResponseSchema = z.object({
  userId: z.string().uuid(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
