import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { nicknameChangeSchema, passwordChangeSchema } from './schema';
import { changeNicknameService, changePasswordService } from './service';
import { success, failure, respond } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/with-auth';
import type { AppEnv } from '@/backend/hono/context';

export function registerProfileRoutes(app: Hono<AppEnv>) {
  const users = new Hono<AppEnv>();

  // 닉네임 변경
  users.patch('/me/nickname', withAuth, zValidator('json', nicknameChangeSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await changeNicknameService(c, body);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    // JWT 토큰을 HTTP-only 쿠키로 재설정
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

  // 비밀번호 변경
  users.patch('/me/password', withAuth, zValidator('json', passwordChangeSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await changePasswordService(c, body);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success({ message: result.data.message }));
  });

  app.route('/users', users);
}
