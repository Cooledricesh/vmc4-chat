import { handle } from 'hono/vercel';
import { createHonoApp } from '@/backend/hono/app';

const app = createHonoApp();

// Next.js catch-all 라우트에서 /api 경로를 제거하고 Hono로 전달
export const runtime = 'nodejs';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
