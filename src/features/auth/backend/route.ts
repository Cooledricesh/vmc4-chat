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
      'SameSite=Strict',
      'Max-Age=86400',
      'Path=/',
    ].join('; ');

    c.header('Set-Cookie', `auth_token=${result.data.token}; ${cookieOptions}`);

    return respond(c, success({ user: result.data.user }));
  });

  auth.post('/register', zValidator('json', registerSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await registerService(c, body);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success({ userId: result.data.userId }, 201));
  });

  auth.post('/logout', async (c) => {
    // 쿠키 삭제
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'HttpOnly',
      ...(isProduction ? ['Secure'] : []),
      'SameSite=Strict',
      'Max-Age=0',
      'Path=/',
    ].join('; ');

    c.header('Set-Cookie', `auth_token=; ${cookieOptions}`);

    return respond(c, success({ message: '로그아웃되었습니다' }));
  });

  app.route('/auth', auth);
}
