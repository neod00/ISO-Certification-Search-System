// LLM 호출 함수
import { ENV } from './env';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
}

interface LLMResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function invokeLLM(request: LLMRequest): Promise<LLMResponse> {
  // LLM API 호출 (OpenAI, Anthropic 등)
  // 현재는 빈 응답 반환
  console.log('[LLM] API call', request);
  
  if (!ENV.llmApiKey) {
    console.warn('[LLM] API key not set, returning empty response');
    return {
      choices: [{
        message: {
          content: '[]'
        }
      }]
    };
  }

  // 실제 LLM API 호출 로직은 여기에 구현
  // 예: OpenAI API, Anthropic API 등
  
  return {
    choices: [{
      message: {
        content: '[]'
      }
    }]
  };
}

