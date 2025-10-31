import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedCertification {
  companyName: string;
  certificationTypes: string[];
  certificationBodies: Array<{
    name: string;
    code?: string;
  }>;
  issuedDate?: string;
  expiryDate?: string;
  status: "valid" | "expired" | "unknown";
  source: string;
  sourceUrl: string;
  retrievedAt: string;
}

const TIMEOUT = 5000; // 5초로 단축하여 성능 최적화
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * KSA (한국표준협회) 인증기업 검색 스크래핑
 * 참고: KSA 웹사이트는 동적 콘텐츠와 로그인이 필요할 수 있어 제한적입니다.
 */
export async function scrapeKSA(companyName: string): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    // KSA 인증현황 페이지 (공개된 정보만 수집 가능)
    const searchUrl = `https://www.ksa.or.kr/ksa_kr/922/subview.do`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500, // 4xx 에러도 허용
    });

    if (response.status !== 200) {
      console.log(`[KSA Scraper] HTTP ${response.status} - Skipping`);
      return results;
    }

    const $ = cheerio.load(response.data);

    // 페이지 전체에서 회사명과 ISO 인증 정보 검색
    const pageText = $("body").text();
    
    // 회사명이 페이지에 포함되어 있는지 확인
    if (pageText.includes(companyName)) {
      // ISO 인증 패턴 찾기
      const isoMatches = pageText.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];
      
      if (isoMatches.length > 0) {
        const uniqueIsos = Array.from(new Set(isoMatches.map((m) => m.trim())));
        
        results.push({
          companyName,
          certificationTypes: uniqueIsos,
          certificationBodies: [{ name: "한국표준협회(KSA)" }],
          status: "unknown",
          source: "KSA",
          sourceUrl: searchUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`[KSA Scraper] Found ${results.length} certifications`);
    return results;
  } catch (error) {
    console.error(
      "[KSA Scraper] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Google 뉴스에서 회사 ISO 인증 정보 검색
 * 한글/영어 검색어 자동 선택
 */
export async function scrapeGoogleNews(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    // 한글이 포함되어 있으면 한국어 검색, 아니면 영어 검색
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(companyName);
    const searchTerm = hasKorean ? "ISO 인증" : "ISO certification";
    const language = hasKorean ? "ko" : "en";
    
    const searchQuery = encodeURIComponent(`${companyName} ${searchTerm}`);
    const newsUrl = `https://news.google.com/search?q=${searchQuery}&hl=${language}`;

    const response = await axios.get(newsUrl, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    // Google 뉴스 아티클 선택자 개선
    const articles = $(
      "article, .article-item, [data-article], .news-item"
    );

    articles.each((_, element) => {
      const $article = $(element);

      const title =
        $article.find("h3, h2, .headline, [data-headline]").text() ||
        $article.text();
      const relativeUrl =
        $article.find("a").attr("href") ||
        $article.find("[data-url]").attr("data-url") ||
        "";
      
      // 상대 경로를 절대 경로로 변환
      const fullUrl = relativeUrl && relativeUrl.startsWith("./") 
        ? `https://news.google.com${relativeUrl.substring(1)}` 
        : relativeUrl || newsUrl;

      if (!title || !title.includes("ISO")) {
        return;
      }

      // ISO 인증 종류 추출
      const isoMatches = title.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];

      if (isoMatches.length > 0) {
        // 중복 제거
        const uniqueIsos = Array.from(new Set(isoMatches.map((m) => m.trim())));

        results.push({
          companyName,
          certificationTypes: uniqueIsos,
          certificationBodies: extractCertBodyFromTitle(title),
          status: "unknown",
          source: "Google News",
          sourceUrl: fullUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`[Google News Scraper] Found ${results.length} news articles (${language})`);
    return results;
  } catch (error) {
    console.error(
      "[Google News Scraper] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Naver 뉴스에서 회사 ISO 인증 정보 검색
 * 참고: Naver는 bot 차단이 강력하여 제한적일 수 있습니다
 */
export async function scrapeNaverNews(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    const searchQuery = encodeURIComponent(`${companyName} ISO 인증`);
    const newsUrl = `https://search.naver.com/search.naver?where=news&query=${searchQuery}&sort=0`;

    const response = await axios.get(newsUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.naver.com/",
      },
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      console.log(`[Naver News Scraper] HTTP ${response.status} - Skipping`);
      return results;
    }

    const $ = cheerio.load(response.data);

    // Naver 뉴스 검색 결과 선택자 업데이트 (2024년 기준)
    const newsItems = $(
      ".news_wrap, .bx, .news_area, article"
    );

    newsItems.each((_, element) => {
      const $item = $(element);

      const title =
        $item.find(".news_tit, .tit, a.news_tit").text().trim() ||
        $item.find("a.dsc_txt_wrap").text().trim() ||
        "";
      const url =
        $item.find(".news_tit, a.news_tit").attr("href") ||
        "";

      if (!title || !title.includes("ISO")) {
        return;
      }

      const isoMatches = title.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];

      if (isoMatches.length > 0) {
        const uniqueIsos = Array.from(new Set(isoMatches.map((m) => m.trim())));

        results.push({
          companyName,
          certificationTypes: uniqueIsos,
          certificationBodies: extractCertBodyFromTitle(title),
          status: "unknown",
          source: "Naver News",
          sourceUrl: url || newsUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`[Naver News Scraper] Found ${results.length} news articles`);
    return results;
  } catch (error) {
    console.error(
      "[Naver News Scraper] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * 회사 공식 홈페이지에서 ISO 인증 정보 검색
 */
export async function scrapeCompanyWebsite(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    // 일반적인 회사 홈페이지 URL 패턴 시도
    const possibleUrls = [
      `https://www.${companyName.replace(/\s+/g, "").toLowerCase()}.com`,
      `https://${companyName.replace(/\s+/g, "").toLowerCase()}.co.kr`,
      `https://www.${companyName.replace(/\s+/g, "").toLowerCase()}.co.kr`,
    ];

    for (const url of possibleUrls) {
      try {
        const response = await axios.get(url, {
          headers: {
            "User-Agent": USER_AGENT,
          },
          timeout: TIMEOUT,
        });

        const $ = cheerio.load(response.data);

        // 인증 정보 섹션 찾기
        const certSections = $(
          ".certification, .cert-section, [data-certification], .quality, .iso-info"
        );

        certSections.each((_, element) => {
          const $section = $(element);
          const text = $section.text();

          const isoMatches = text.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];

          if (isoMatches.length > 0) {
            const uniqueIsos = Array.from(new Set(isoMatches.map((m) => m.trim())));

            // 인증기관 추출 시도
            const certBodies = extractCertBodyFromText(text);

            results.push({
              companyName,
              certificationTypes: uniqueIsos,
              certificationBodies: certBodies,
              status: "unknown",
              source: "Company Website",
              sourceUrl: url,
              retrievedAt: new Date().toISOString(),
            });
          }
        });

        if (results.length > 0) {
          console.log(
            `[Company Website Scraper] Found certifications at ${url}`
          );
          break;
        }
      } catch (error) {
        // URL 접근 실패, 다음 URL 시도
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error(
      "[Company Website Scraper] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * 네이버 블로그에서 회사 ISO 인증 정보 검색
 * 참고: Naver는 bot 차단이 강력하여 제한적일 수 있습니다
 */
export async function scrapeNaverBlog(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    const searchQuery = encodeURIComponent(`${companyName} ISO 인증`);
    const blogUrl = `https://search.naver.com/search.naver?where=blog&query=${searchQuery}&sort=0`;

    const response = await axios.get(blogUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.naver.com/",
      },
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      console.log(`[Naver Blog Scraper] HTTP ${response.status} - Skipping`);
      return results;
    }

    const $ = cheerio.load(response.data);

    // 블로그 검색 결과 선택자 업데이트 (2024년 기준)
    const posts = $(
      ".bx, .total_wrap, .api_ani_send, .detail_box"
    );

    posts.each((_, element) => {
      const $post = $(element);

      const title =
        $post.find(".title_link, .total_tit, a.api_txt_lines").text().trim() ||
        "";
      const url =
        $post.find(".title_link, a.api_txt_lines").attr("href") ||
        "";

      if (!title || !title.includes("ISO")) {
        return;
      }

      const isoMatches = title.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];

      if (isoMatches.length > 0) {
        const uniqueIsos = Array.from(new Set(isoMatches.map((m) => m.trim())));

        results.push({
          companyName,
          certificationTypes: uniqueIsos,
          certificationBodies: extractCertBodyFromTitle(title),
          status: "unknown",
          source: "Naver Blog",
          sourceUrl: url || blogUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`[Naver Blog Scraper] Found ${results.length} blog posts`);
    return results;
  } catch (error) {
    console.error(
      "[Naver Blog Scraper] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * 모든 소스에서 병렬로 데이터 수집
 */
export async function scrapeAllSources(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const [ksa, googleNews, naverNews, company, blog] = await Promise.allSettled([
      scrapeKSA(companyName),
      scrapeGoogleNews(companyName),
      scrapeNaverNews(companyName),
      scrapeCompanyWebsite(companyName),
      scrapeNaverBlog(companyName),
    ]);

    const results: ScrapedCertification[] = [];

    // 성공한 결과만 수집
    if (ksa.status === "fulfilled") results.push(...ksa.value);
    if (googleNews.status === "fulfilled") results.push(...googleNews.value);
    if (naverNews.status === "fulfilled") results.push(...naverNews.value);
    if (company.status === "fulfilled") results.push(...company.value);
    if (blog.status === "fulfilled") results.push(...blog.value);

    console.log(`[All Sources] Total ${results.length} certifications found`);
    return results;
  } catch (error) {
    console.error(
      "[All Sources] Error:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * 스크래핑된 데이터를 표준 형식으로 변환
 */
export function convertScrapedToStandard(
  scraped: ScrapedCertification[]
): Array<{
  companyName: string;
  certificationTypes: string[];
  certificationBodies: Array<{ name: string; code?: string }>;
  issuedDate?: string;
  expiryDate?: string;
  status: "valid" | "expired" | "unknown";
  sources: Array<{ url: string; source: string; retrievedAt: string }>;
}> {
  return scraped.map((item) => ({
    companyName: item.companyName,
    certificationTypes: item.certificationTypes,
    certificationBodies: item.certificationBodies,
    issuedDate: item.issuedDate,
    expiryDate: item.expiryDate,
    status: item.status,
    sources: [
      {
        url: item.sourceUrl,
        source: item.source,
        retrievedAt: item.retrievedAt,
      },
    ],
  }));
}

/**
 * 유틸리티 함수: 날짜 문자열 정규화
 */
function formatDateString(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // YYYY-MM-DD 형식으로 변환 시도
  const match = dateStr.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return undefined;
}

/**
 * 유틸리티 함수: 인증 상태 판단
 */
function determineStatus(
  expiryDateStr: string
): "valid" | "expired" | "unknown" {
  if (!expiryDateStr) return "unknown";

  const expiryDate = new Date(expiryDateStr);
  const today = new Date();

  if (expiryDate < today) {
    return "expired";
  } else {
    return "valid";
  }
}

/**
 * 유틸리티 함수: 제목에서 인증기관 추출
 */
function extractCertBodyFromTitle(
  title: string
): Array<{ name: string; code?: string }> {
  const certBodies: Array<{ name: string; code?: string }> = [];
  const titleUpper = title.toUpperCase();

  // 주요 국제 ISO 인증기관 (대소문자 구분 없이 검색)
  const certBodyPatterns = [
    // 한국 인증기관
    { pattern: "한국표준협회", name: "한국표준협회 (KSA)", code: "KSA" },
    { pattern: "KSA", name: "한국표준협회 (KSA)", code: "KSA" },
    { pattern: "한국품질재단", name: "한국품질재단 (KFQ)", code: "KFQ" },
    { pattern: "KFQ", name: "한국품질재단 (KFQ)", code: "KFQ" },
    { pattern: "KTL", name: "한국산업기술시험원 (KTL)", code: "KTL" },
    
    // 글로벌 주요 인증기관
    { pattern: "TUV", name: "TÜV", code: "TUV" },
    { pattern: "TÜV", name: "TÜV", code: "TUV" },
    { pattern: "SGS", name: "SGS", code: "SGS" },
    { pattern: "DNV", name: "DNV", code: "DNV" },
    { pattern: "DNV GL", name: "DNV GL", code: "DNV" },
    { pattern: "BSI", name: "BSI", code: "BSI" },
    { pattern: "BUREAU VERITAS", name: "Bureau Veritas", code: "BV" },
    { pattern: "BUREAU VÉRITAS", name: "Bureau Veritas", code: "BV" },
    { pattern: "로이드", name: "Lloyd's Register (LRQA)", code: "LRQA" },
    { pattern: "LRQA", name: "Lloyd's Register (LRQA)", code: "LRQA" },
    { pattern: "LLOYD", name: "Lloyd's Register (LRQA)", code: "LRQA" },
    { pattern: "INTERTEK", name: "Intertek", code: "Intertek" },
    { pattern: "UL", name: "UL (Underwriters Laboratories)", code: "UL" },
    { pattern: "UNDERWRITERS", name: "UL (Underwriters Laboratories)", code: "UL" },
    { pattern: "ABS", name: "ABS Quality Evaluations", code: "ABS" },
    { pattern: "RINA", name: "RINA", code: "RINA" },
    { pattern: "DQS", name: "DQS", code: "DQS" },
    { pattern: "AFNOR", name: "AFNOR", code: "AFNOR" },
    { pattern: "DEKRA", name: "DEKRA", code: "DEKRA" },
    { pattern: "SAI GLOBAL", name: "SAI Global", code: "SAI" },
    { pattern: "NQA", name: "NQA", code: "NQA" },
    { pattern: "UKAS", name: "UKAS", code: "UKAS" },
    { pattern: "ANAB", name: "ANAB", code: "ANAB" },
    { pattern: "IQNet", name: "IQNet", code: "IQNet" },
    { pattern: "JQA", name: "JQA (Japan)", code: "JQA" },
    { pattern: "CQC", name: "CQC (China)", code: "CQC" },
    { pattern: "KEMA", name: "KEMA", code: "KEMA" },
    { pattern: "PERRY JOHNSON", name: "Perry Johnson", code: "PJR" },
    { pattern: "NEMKO", name: "Nemko", code: "Nemko" },
  ];

  const found = new Set<string>(); // 중복 방지

  for (const { pattern, name, code } of certBodyPatterns) {
    const patternUpper = pattern.toUpperCase();
    if (titleUpper.includes(patternUpper) && !found.has(code)) {
      certBodies.push({ name, code });
      found.add(code);
    }
  }

  return certBodies;
}

/**
 * 유틸리티 함수: 텍스트에서 인증기관 추출
 */
function extractCertBodyFromText(
  text: string
): Array<{ name: string; code?: string }> {
  // extractCertBodyFromTitle와 동일한 로직 사용
  return extractCertBodyFromTitle(text);
}

