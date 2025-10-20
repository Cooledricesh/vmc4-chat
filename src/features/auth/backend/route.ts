import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema, registerSchema } from './schema';
import { loginService, registerService } from './service';
import { success, failure, respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';

export function registerAuthRoutes(app: Hono<AppEnv>) {
  const auth = new Hono<AppEnv>();

  auth.post('/login', zValidator('json', loginSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await loginService(c, body);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    // JWT 토큰을 HTTP-only 쿠키로 설정
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'HttpOnly',
      ...(isProduction ? ['Secure'] : []),
      'SameSite=Lax', // Strict에서 Lax로 변경하여 리다이렉션 시 쿠키 전송 허용
      'Max-Age=86400',
      'Path=/',
    ].join('; ');

    c.header('Set-Cookie', `auth_token=${result.data.token}; ${cookieOptions}`);

    return respond(c, success({ user: result.data.user }));
  });

  auth.post('/register', zValidator('json', registerSchema), async (c) => {
    const logger = c.get('logger');
    logger?.info?.('[POST /auth/register] Request received');

    const body = c.req.valid('json');
    logger?.info?.('[POST /auth/register] Validated input:', { email: body.email, nickname: body.nickname });

    const result = await registerService(c, body);

    if (!result.success) {
      logger?.warn?.('[POST /auth/register] Registration failed:', result.error);
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    logger?.info?.('[POST /auth/register] Registration successful:', result.data.userId);
    return respond(c, success({ userId: result.data.userId }, 201));
  });

  auth.post('/logout', async (c) => {
    // 쿠키 삭제
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'HttpOnly',
      ...(isProduction ? ['Secure'] : []),
      'SameSite=Lax',
      'Max-Age=0',
      'Path=/',
    ].join('; ');

    c.header('Set-Cookie', `auth_token=; ${cookieOptions}`);

    return respond(c, success({ message: '로그아웃되었습니다' }));
  });

  app.route('/auth', auth);
}
