import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import jwt from 'jsonwebtoken';

// 확장된 AppEnv 타입
type AuthEnv = AppEnv & {
  Variables: AppEnv['Variables'] & {
    userId?: string;
    userEmail?: string;
    userNickname?: string;
  };
};

export const withAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const token = getCookie(c, 'auth_token');

  if (!token) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다',
        },
      },
      401
    );
  }

  try {
    const config = c.get('config');
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      nickname: string;
    };

    // 컨텍스트에 사용자 정보 설정
    (c as any).set('userId', decoded.userId);
    (c as any).set('userEmail', decoded.email);
    (c as any).set('userNickname', decoded.nickname);

    await next();
  } catch (error) {
    return c.json(
      {
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 토큰입니다',
        },
      },
      401
    );
  }
};
