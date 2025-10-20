import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sendMessageSchema, toggleReactionSchema } from './schema';
import {
  getRoomInfoService,
  getMessagesService,
  sendMessageService,
  deleteMessageService,
  toggleReactionService,
  getParticipantsService,
  joinRoomService,
} from './service';
import { success, failure, respond } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/with-auth';
import type { AppEnv } from '@/backend/hono/context';

export function registerChatroomRoutes(app: Hono<AppEnv>) {
  const chatroom = new Hono<AppEnv>();

  // 모든 chatroom 라우트에 인증 미들웨어 적용
  chatroom.use('*', withAuth);

  // 채팅방 정보 조회
  chatroom.get('/:roomId', async (c) => {
    const roomId = c.req.param('roomId');

    const result = await getRoomInfoService(c, roomId);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success(result.data));
  });

  // 채팅방 입장 (참여자 추가)
  chatroom.post('/:roomId/join', async (c) => {
    const roomId = c.req.param('roomId');
    const userId = (c as any).get('userId') as string | undefined;

    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
    }

    const result = await joinRoomService(c, roomId, userId);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success(result.data));
  });

  // 메시지 목록 조회
  chatroom.get('/:roomId/messages', async (c) => {
    const roomId = c.req.param('roomId');
    const limit = Number(c.req.query('limit')) || 50;
    const offset = Number(c.req.query('offset')) || 0;

    const result = await getMessagesService(c, roomId, { limit, offset });

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success(result.data));
  });

  // 메시지 전송
  chatroom.post(
    '/:roomId/messages',
    zValidator('json', sendMessageSchema),
    async (c) => {
      const roomId = c.req.param('roomId');
      const userId = (c as any).get('userId') as string | undefined;

      if (!userId) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
      }

      const body = c.req.valid('json');
      const result = await sendMessageService(c, roomId, userId, body);

      if (!result.success) {
        return respond(c, failure(result.error.status, result.error.code, result.error.message));
      }

      return respond(c, success(result.data, 201));
    }
  );

  // 메시지 삭제
  chatroom.delete('/:roomId/messages/:messageId', async (c) => {
    const roomId = c.req.param('roomId');
    const messageId = c.req.param('messageId');
    const userId = (c as any).get('userId') as string | undefined;

    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
    }

    const result = await deleteMessageService(c, roomId, messageId, userId);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success(result.data));
  });

  // 좋아요 토글
  chatroom.post(
    '/:roomId/messages/:messageId/reactions',
    zValidator('json', toggleReactionSchema),
    async (c) => {
      const roomId = c.req.param('roomId');
      const messageId = c.req.param('messageId');
      const userId = (c as any).get('userId') as string | undefined;

      if (!userId) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
      }

      const body = c.req.valid('json');
      const result = await toggleReactionService(c, roomId, messageId, userId, body);

      if (!result.success) {
        return respond(c, failure(result.error.status, result.error.code, result.error.message));
      }

      return respond(c, success(result.data));
    }
  );

  // 참여자 목록 조회
  chatroom.get('/:roomId/participants', async (c) => {
    const roomId = c.req.param('roomId');

    const result = await getParticipantsService(c, roomId);

    if (!result.success) {
      return respond(c, failure(result.error.status, result.error.code, result.error.message));
    }

    return respond(c, success(result.data));
  });

  app.route('/chatroom', chatroom);
}
