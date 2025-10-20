import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerAuthRoutes } from '@/features/auth/backend/route';
import { registerRoomsRoutes } from '@/features/rooms/backend/route';
import { registerChatroomRoutes } from '@/features/chatroom/backend/route';
import { registerProfileRoutes } from '@/features/profile/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  // Next.js [[...hono]] catch-all route와 통합하기 위해 basePath 설정
  const app = new Hono<AppEnv>().basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerAuthRoutes(app);
  registerRoomsRoutes(app);
  registerChatroomRoutes(app);
  registerProfileRoutes(app);

  singletonApp = app;

  return app;
};
