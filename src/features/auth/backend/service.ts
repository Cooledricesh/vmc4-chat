import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { LoginInput, RegisterInput } from './schema';
import { AUTH_ERRORS } from './error';

export async function loginService(c: Context<AppEnv>, input: LoginInput) {
  const supabase = c.get('supabase');
  const config = c.get('config');
  const logger = c.get('logger');

  logger?.info?.('[loginService] Login attempt for:', input.email);

  try {
    // 사용자 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, nickname, password_hash')
      .eq('email', input.email)
      .single();

    if (error) {
      logger?.error?.('[loginService] Database error:', error);
      return {
        success: false as const,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
      };
    }

    if (!user) {
      logger?.warn?.('[loginService] User not found:', input.email);
      return {
        success: false as const,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
      };
    }

    logger?.info?.('[loginService] User found, verifying password');

    // 비밀번호 검증
    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      logger?.warn?.('[loginService] Invalid password for:', input.email);
      return {
        success: false as const,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
      };
    }

    logger?.info?.('[loginService] Password valid, generating token');

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

    logger?.info?.('[loginService] Login successful for:', input.email);

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
  } catch (err) {
    logger?.error?.('[loginService] Unexpected error:', err);
    throw err; // errorBoundary에서 처리
  }
}

export async function registerService(c: Context<AppEnv>, input: RegisterInput) {
  const supabase = c.get('supabase');
  const logger = c.get('logger');

  logger?.info?.('[registerService] Starting registration for:', input.email);

  // 이메일 중복 확인
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116은 "not found" 에러로, 정상적인 경우
    logger?.error?.('[registerService] Error checking existing user:', checkError);
  }

  if (existingUser) {
    logger?.info?.('[registerService] Email already exists:', input.email);
    return {
      success: false as const,
      error: AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
    };
  }

  // 비밀번호 해싱
  logger?.info?.('[registerService] Hashing password');
  const passwordHash = await bcrypt.hash(input.password, 10);

  // 사용자 생성
  logger?.info?.('[registerService] Creating user');
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: input.email,
      nickname: input.nickname,
      password_hash: passwordHash,
    })
    .select('id')
    .single();

  if (error) {
    logger?.error?.('[registerService] Error creating user:', error);
    return {
      success: false as const,
      error: AUTH_ERRORS.REGISTRATION_FAILED,
    };
  }

  if (!user) {
    logger?.error?.('[registerService] User creation returned no data');
    return {
      success: false as const,
      error: AUTH_ERRORS.REGISTRATION_FAILED,
    };
  }

  logger?.info?.('[registerService] User created successfully:', user.id);
  return {
    success: true as const,
    data: {
      userId: user.id,
    },
  };
}
