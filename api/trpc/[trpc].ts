/**
 * Vercel 서버리스 함수를 위한 tRPC API 핸들러
 * 
 * 이 파일은 Vercel의 서버리스 함수로 실행되며,
 * tRPC 요청을 처리합니다.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../routers";

// Vercel 서버리스 함수 설정
export const config = {
  runtime: "nodejs18.x", // Node.js 18 런타임 사용
  maxDuration: 60, // Pro 플랜: 최대 60초 (Free: 10초)
};

/**
 * tRPC 요청을 처리하는 메인 핸들러
 */
async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Vercel 환경에 맞는 컨텍스트 생성
      // 필요한 경우 여기에 인증 로직 추가 가능
      return {
        req,
        user: null, // 인증 정보
      };
    },
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  });
}

// GET 및 POST 요청 모두 지원
export { handler as GET, handler as POST };

// 기본 export (Vercel이 요구)
export default handler;

