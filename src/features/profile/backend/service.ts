import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { NicknameChangeInput, PasswordChangeInput } from './schema';
import { PROFILE_ERRORS } from './error';

export async function changeNicknameService(c: Context<AppEnv>, input: NicknameChangeInput) {
  const supabase = c.get('supabase');
  const userId = (c as any).get('userId') as string | undefined;
  const config = c.get('config');

  if (!userId) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.UNAUTHORIZED,
    };
  }

  // 닉네임 업데이트
  const { data: user, error } = await supabase
    .from('users')
    .update({ nickname: input.nickname })
    .eq('id', userId)
    .select('id, email, nickname')
    .single();

  if (error || !user) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.NICKNAME_UPDATE_FAILED,
    };
  }

  // JWT 재발급
  const newToken = jwt.sign(
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
      token: newToken,
    },
  };
}

export async function changePasswordService(c: Context<AppEnv>, input: PasswordChangeInput) {
  const supabase = c.get('supabase');
  const userId = (c as any).get('userId') as string | undefined;

  if (!userId) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.UNAUTHORIZED,
    };
  }

  // 기존 비밀번호 검증
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (!user) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.USER_NOT_FOUND,
    };
  }

  const isValid = await bcrypt.compare(input.currentPassword, user.password_hash);

  if (!isValid) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.INVALID_PASSWORD,
    };
  }

  // 새 비밀번호 해싱
  const newHash = await bcrypt.hash(input.newPassword, 10);

  // 비밀번호 업데이트
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', userId);

  if (error) {
    return {
      success: false as const,
      error: PROFILE_ERRORS.PASSWORD_UPDATE_FAILED,
    };
  }

  return {
    success: true as const,
    data: {
      message: '비밀번호가 변경되었습니다',
    },
  };
}
