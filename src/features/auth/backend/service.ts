import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { LoginInput } from './schema';
import { AUTH_ERRORS } from './error';

export async function loginService(c: Context<AppEnv>, input: LoginInput) {
  const supabase = c.get('supabase');
  const config = c.get('config');

  // 사용자 조회
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, nickname, password_hash')
    .eq('email', input.email)
    .single();

  if (error || !user) {
    return {
      success: false as const,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
    };
  }

  // 비밀번호 검증
  const isValid = await bcrypt.compare(input.password, user.password_hash);

  if (!isValid) {
    return {
      success: false as const,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
    };
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    success: true as const,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      token,
    },
  };
}
