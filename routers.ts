import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  iso: router({
    search: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "companyName" in val) {
          return { companyName: String((val as Record<string, unknown>).companyName) };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { searchISOCertifications } = await import("./isoSearch");
        const { getCachedSearchResults, setCachedSearchResults } = await import("./db");

        // Check cache first
        const cached = await getCachedSearchResults(input.companyName);
        if (cached) {
          return {
            results: cached,
            fromCache: true,
            timestamp: new Date().toISOString(),
          };
        }

        // Search for certifications
        const results = await searchISOCertifications(input.companyName);

        // Cache the results
        if (results.length > 0) {
          await setCachedSearchResults(input.companyName, results, 24);
        }

        return {
          results,
          fromCache: false,
          timestamp: new Date().toISOString(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
