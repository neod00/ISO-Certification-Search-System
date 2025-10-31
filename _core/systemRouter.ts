// 시스템 라우터
import { router, publicProcedure } from './trpc';

export const systemRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});

