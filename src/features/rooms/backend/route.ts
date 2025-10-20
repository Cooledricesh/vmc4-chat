import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createRoomSchema } from './schema';
import { getRoomsService, createRoomService } from './service';
import { success, failure, respond } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/with-auth';
import type { AppEnv } from '@/backend/hono/context';

export function registerRoomsRoutes(app: Hono<AppEnv>) {
  const rooms = new Hono<AppEnv>();

  // 모든 rooms 라우트에 인증 미들웨어 적용
  rooms.use('*', withAuth);

  // 채팅방 목록 조회
  rooms.get('/', async (c) => {
    const result = await getRoomsService(c);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success({ rooms: result.data.rooms }));
  });

  // 채팅방 생성
  rooms.post('/', zValidator('json', createRoomSchema), async (c) => {
    const userId = (c as any).get('userId') as string | undefined;
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
    }

    const body = c.req.valid('json');
    const result = await createRoomService(c, { ...body, creatorId: userId });

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success({ room: result.data.room }, 201));
  });

  app.route('/rooms', rooms);
}
