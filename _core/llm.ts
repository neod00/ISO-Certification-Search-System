// LLM 호출 함수 - OpenAI API 통합
import { ENV } from './env';
import OpenAI from 'openai';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface LLMResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// OpenAI 클라이언트 (싱글톤)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!ENV.llmApiKey) {
    return null;
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: ENV.llmApiKey,
    });
  }
  
  return openaiClient;
}

export async function invokeLLM(request: LLMRequest): Promise<LLMResponse> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('[LLM] API key not set, returning empty response');
    return {
      choices: [{
        message: {
          content: '[]'
        }
      }]
    };
  }

  try {
    console.log('[LLM] API call starting...', {
      model: request.model || 'gpt-4o-mini',
      messageCount: request.messages.length
    });

    const completion = await client.chat.completions.create({
      model: request.model || 'gpt-4o-mini',
      messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: request.temperature ?? 0,
      max_tokens: request.max_tokens ?? 500,
    });

    console.log('[LLM] API call successful', {
      usage: completion.usage,
      model: completion.model
    });

    return {
      choices: completion.choices.map(choice => ({
        message: {
          content: choice.message.content || ''
        }
      }))
    };

  } catch (error) {
    console.error('[LLM] API call failed:', error);
    
    // 에러 시 빈 응답 반환
    return {
      choices: [{
        message: {
          content: '[]'
        }
      }]
    };
  }
}

