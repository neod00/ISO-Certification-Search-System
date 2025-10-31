import { invokeLLM } from "./_core/llm";
import { scrapeAllSources, convertScrapedToStandard } from "./webScraper";
import { getDb } from "./db";
import { isoCertifications, searchCache } from "./drizzle/schema";
import { like, eq, or } from "drizzle-orm";

export interface CertificationSource {
  url: string;
  source: string;
  retrievedAt: string;
}

export interface CertificationInfo {
  companyName: string;
  certificationTypes: string[];
  certificationBodies: Array<{
    name: string;
    code?: string;
  }>;
  issuedDate?: string;
  expiryDate?: string;
  status: "valid" | "expired" | "unknown";
  sources: CertificationSource[];
}

// 캐시 설정
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

// 서버리스 환경에 최적화된 타임아웃
// Netlify Free: 10초, Vercel Free: 10초, Pro: 60초 제한을 고려
const SCRAPING_TIMEOUT_MS = process.env.NETLIFY 
  ? 4000 // Netlify: 10초 제한이므로 여유를 두고 4초
  : process.env.VERCEL 
  ? (process.env.VERCEL_ENV === "production" ? 8000 : 4000) // Vercel 프로덕션에서 더 여유
  : 5000; // 로컬 개발 환경

const MAX_PARALLEL_REQUESTS = 3; // 병렬 요청 제한

console.log(`[ISO Search] Timeout configured: ${SCRAPING_TIMEOUT_MS}ms (Platform: ${
  process.env.NETLIFY ? 'Netlify' : 
  process.env.VERCEL ? 'Vercel' : 
  'Local'
})`);

/**
 * 검색 결과를 캐시에서 먼저 확인
 */
async function getCachedResult(companyName: string): Promise<CertificationInfo[] | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const cached = await db
      .select()
      .from(searchCache)
      .where(eq(searchCache.searchQuery, companyName))
      .limit(1);

    if (cached.length === 0) return null;

    const cacheEntry = cached[0];
    const cacheAge = Date.now() - cacheEntry.createdAt.getTime();

    // 캐시가 유효한지 확인
    if (cacheAge < CACHE_TTL_MS) {
      console.log(`[Cache Hit] Found cached results for ${companyName}`);
      return JSON.parse(cacheEntry.results);
    }

    // 캐시가 만료됨
    console.log(`[Cache Expired] Cache for ${companyName} expired`);
    return null;
  } catch (error) {
    console.error("[Cache Retrieval] Error:", error);
    return null;
  }
}

/**
 * 검색 결과를 캐시에 저장
 */
async function cacheResult(
  companyName: string,
  results: CertificationInfo[]
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .insert(searchCache)
      .values({
        searchQuery: companyName,
        results: JSON.stringify(results),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      })
      .onDuplicateKeyUpdate({
        set: {
          results: JSON.stringify(results),
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
      });

    console.log(`[Cache Saved] Cached results for ${companyName}`);
  } catch (error) {
    console.error("[Cache Save] Error:", error);
  }
}

/**
 * 타임아웃이 있는 Promise 래퍼
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * ISO 인증 정보 검색 (캐싱 및 성능 최적화)
 */
export async function searchISOCertifications(
  companyName: string
): Promise<CertificationInfo[]> {
  // 1. 캐시에서 먼저 확인
  const cachedResults = await getCachedResult(companyName);
  if (cachedResults) {
    return cachedResults;
  }

  const results: CertificationInfo[] = [];

  // 2. 데이터베이스 검색 (항상 먼저 수행)
  const dbResults = await searchDatabase(companyName);
  results.push(...dbResults);

  // 3. 웹 스크래핑과 LLM 검색을 병렬로 수행하되 타임아웃 설정
  const [scrapedResults, llmResults] = await Promise.allSettled([
    withTimeout(scrapeWithTimeout(companyName), SCRAPING_TIMEOUT_MS),
    withTimeout(searchViaLLM(companyName), SCRAPING_TIMEOUT_MS),
  ]).then((results) => [
    results[0].status === "fulfilled" ? results[0].value : [],
    results[1].status === "fulfilled" ? results[1].value : [],
  ]);

  results.push(...scrapedResults);
  results.push(...llmResults);

  // 4. 결과 병합 및 중복 제거
  const mergedResults = mergeResults(results);

  // 5. 결과를 캐시에 저장
  if (mergedResults.length > 0) {
    await cacheResult(companyName, mergedResults);
  }

  return mergedResults;
}

/**
 * 타임아웃이 있는 웹 스크래핑
 */
async function scrapeWithTimeout(companyName: string): Promise<CertificationInfo[]> {
  try {
    const scrapedResults = await scrapeAllSources(companyName);
    const convertedScraped = convertScrapedToStandard(scrapedResults);
    return convertedScraped;
  } catch (error) {
    console.error("[Web Scraping] Error:", error);
    return [];
  }
}

/**
 * 데이터베이스에서 ISO 인증 정보 검색 (최적화됨)
 */
async function searchDatabase(companyName: string): Promise<CertificationInfo[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    // LIKE 쿼리: 한국어 회사명과 영어 회사명 모두 검색
    const dbResults = await db
      .select()
      .from(isoCertifications)
      .where(
        or(
          like(isoCertifications.companyName, `%${companyName}%`),
          like(isoCertifications.companyNameEn, `%${companyName}%`)
        )
      )
      .limit(20);

    return dbResults.map((row) => ({
      companyName: row.companyName,
      certificationTypes: JSON.parse(row.certificationTypes),
      certificationBodies: JSON.parse(row.certificationBodies),
      issuedDate: row.issuedDate || undefined,
      expiryDate: row.expiryDate || undefined,
      status: row.status,
      sources: JSON.parse(row.sources),
    }));
  } catch (error) {
    console.error("[Database Search] Error:", error);
    return [];
  }
}

/**
 * LLM을 사용한 ISO 인증 정보 검색 (타임아웃 적용)
 */
async function searchViaLLM(companyName: string): Promise<CertificationInfo[]> {
  try {
    const prompt = `Search for ISO certification information for the company "${companyName}". 
    Return a JSON array with the following structure:
    [
      {
        "companyName": "Company Name",
        "certificationTypes": ["ISO 9001:2015", "ISO 14001:2015"],
        "certificationBodies": [{"name": "KSA"}, {"name": "LRQA"}],
        "issuedDate": "YYYY-MM-DD",
        "expiryDate": "YYYY-MM-DD",
        "status": "valid|expired|unknown",
        "sources": [{"url": "https://...", "source": "Source Name", "retrievedAt": "ISO8601"}]
      }
    ]
    If no information is found, return an empty array [].`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an ISO certification information search assistant. Return only valid JSON, no other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) return [];

    let jsonStr = "";
    if (typeof messageContent === "string") {
      const jsonMatch = messageContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      jsonStr = jsonMatch[0];
    } else {
      return [];
    }

    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[LLM Search] Error:", error);
    return [];
  }
}

/**
 * 여러 소스의 결과를 병합하고 중복 제거 (최적화됨)
 */
function mergeResults(results: CertificationInfo[]): CertificationInfo[] {
  const merged = new Map<string, CertificationInfo>();

  // 정렬: 데이터베이스 결과를 먼저 처리 (더 신뢰할 수 있음)
  const sortedResults = results.sort((a, b) => {
    const aIsDb = a.sources.some((s) => s.source === "KSA");
    const bIsDb = b.sources.some((s) => s.source === "KSA");
    return aIsDb ? -1 : bIsDb ? 1 : 0;
  });

  for (const result of sortedResults) {
    // 회사명과 인증 종류로 키 생성
    const key = `${result.companyName.toLowerCase()}|${result.certificationTypes
      .sort()
      .join(",")}`;

    if (merged.has(key)) {
      const existing = merged.get(key)!;

      // 새로운 출처만 추가
      const newSources = result.sources.filter(
        (s) =>
          !existing.sources.some(
            (es) => es.url === s.url && es.source === s.source
          )
      );

      if (newSources.length > 0) {
        existing.sources.push(...newSources);
      }

      // 더 최신의 날짜 정보가 있으면 업데이트
      if (
        result.issuedDate &&
        (!existing.issuedDate ||
          new Date(result.issuedDate) > new Date(existing.issuedDate))
      ) {
        existing.issuedDate = result.issuedDate;
      }

      if (
        result.expiryDate &&
        (!existing.expiryDate ||
          new Date(result.expiryDate) > new Date(existing.expiryDate))
      ) {
        existing.expiryDate = result.expiryDate;
      }

      // 상태 업데이트 (유효함 > 미확인 > 만료됨)
      if (
        result.status === "valid" ||
        (result.status === "unknown" && existing.status === "expired")
      ) {
        existing.status = result.status;
      }
    } else {
      merged.set(key, { ...result });
    }
  }

  // 출처 수로 정렬 (더 많은 출처 = 더 신뢰할 수 있음)
  return Array.from(merged.values()).sort(
    (a, b) => b.sources.length - a.sources.length
  );
}

