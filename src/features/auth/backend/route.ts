import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from './schema';
import { loginService } from './service';
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
    const cookieOptions = [
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=86400',
      'Path=/',
    ].join('; ');

    c.header('Set-Cookie', `auth_token=${result.data.token}; ${cookieOptions}`);

    return respond(c, success({ user: result.data.user }));
  });

  app.route('/auth', auth);
}
