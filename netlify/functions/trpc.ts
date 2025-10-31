/**
 * Netlify 서버리스 함수를 위한 tRPC API 핸들러
 * 
 * Netlify Functions는 10초 타임아웃 제한이 있습니다 (무료 플랜)
 * 이에 맞춰 최적화된 tRPC 핸들러입니다.
 */

import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../routers";

/**
 * Netlify Event를 Web API Request로 변환
 */
function createRequest(event: HandlerEvent): Request {
  const url = new URL(event.path, `https://${event.headers.host || 'localhost'}`);
  
  // Query parameters 추가
  if (event.queryStringParameters) {
    Object.entries(event.queryStringParameters).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  // HTTP 메서드와 헤더 설정
  const init: RequestInit = {
    method: event.httpMethod,
    headers: new Headers(event.headers as HeadersInit),
  };

  // Body 추가 (POST, PUT 등)
  if (event.body) {
    init.body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64').toString() 
      : event.body;
  }

  return new Request(url.toString(), init);
}

/**
 * Netlify 서버리스 함수 핸들러
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Netlify 함수 실행 시간 제한 (10초)
  // 이벤트 루프가 비어있을 때까지 대기하지 않음
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(`[Netlify Function] ${event.httpMethod} ${event.path}`);

  try {
    // OPTIONS 요청 (CORS preflight) 처리
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        body: "",
      };
    }

    // Netlify Event를 Request 객체로 변환
    const request = createRequest(event);

    // tRPC 요청 처리
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: () => ({
        // Netlify 컨텍스트 전달
        netlify: {
          event,
          context,
        },
        user: null, // 인증 정보 (필요 시 추가)
      }),
      onError: ({ error, path, type }) => {
        console.error(`[tRPC Error] ${type} at ${path}:`, error);
        
        // 타임아웃 경고
        if (error.message.includes('timeout')) {
          console.warn('[Netlify] Function approaching 10-second timeout limit');
        }
      },
    });

    // Response를 Netlify 형식으로 변환
    const body = await response.text();
    const headers: Record<string, string> = {};
    
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // CORS 헤더 추가
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization";

    return {
      statusCode: response.status,
      headers,
      body,
    };

  } catch (error) {
    console.error('[Netlify Function] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
    };
  }
};

export { handler };

