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
 * 더 정확한 CSS 선택자와 에러 처리 강화
 */
export async function scrapeKSA(companyName: string): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    // KSA 인증 검색 API 시도
    const searchUrl = `https://ksa.or.kr/ksa_kr/876/subview.do`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    // KSA 페이지 구조 분석 및 데이터 추출
    // 테이블 또는 리스트 형식의 인증 정보 찾기
    const certElements = $(
      "table tbody tr, .cert-list li, .certification-item, [data-certification]"
    );

    if (certElements.length === 0) {
      console.log("[KSA Scraper] No certification elements found on page");
      return results;
    }

    certElements.each((_, element) => {
      const $el = $(element);

      // 회사명 추출 (여러 가능성)
      const companyText =
        $el.find("td:nth-child(1), .company-name, [data-company]").text() ||
        $el.find("strong").first().text() ||
        "";

      // 인증 종류 추출
      const certTypeText =
        $el.find("td:nth-child(2), .cert-type, [data-cert-type]").text() ||
        $el.find(".iso-type").text() ||
        "";

      // 인증기관 추출
      const certBodyText =
        $el.find("td:nth-child(3), .cert-body, [data-cert-body]").text() ||
        $el.find(".cert-agency").text() ||
        "";

      // 발급일 추출
      const issuedDateText =
        $el.find("td:nth-child(4), .issued-date, [data-issued]").text() || "";

      // 만료일 추출
      const expiryDateText =
        $el.find("td:nth-child(5), .expiry-date, [data-expiry]").text() || "";

      // 회사명 필터링
      if (
        !companyText ||
        !companyText.toLowerCase().includes(companyName.toLowerCase())
      ) {
        return;
      }

      // ISO 인증 종류 추출 (ISO 9001, ISO 14001 등)
      const isoMatches = certTypeText.match(/ISO\s+\d{4,5}(?::\d{4})?/g) || [];

      if (isoMatches.length > 0) {
        results.push({
          companyName: companyText.trim(),
          certificationTypes: isoMatches.map((m) => m.trim()),
          certificationBodies: certBodyText
            ? [{ name: certBodyText.trim() }]
            : [],
          issuedDate: formatDateString(issuedDateText),
          expiryDate: formatDateString(expiryDateText),
          status: determineStatus(expiryDateText),
          source: "KSA",
          sourceUrl: searchUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    });

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
 */
export async function scrapeGoogleNews(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    const searchQuery = encodeURIComponent(`${companyName} ISO 인증`);
    const newsUrl = `https://news.google.com/search?q=${searchQuery}&hl=ko`;

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
      const url =
        $article.find("a").attr("href") ||
        $article.find("[data-url]").attr("data-url") ||
        "";

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
          sourceUrl: url || newsUrl,
          retrievedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`[Google News Scraper] Found ${results.length} news articles`);
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
 */
export async function scrapeNaverNews(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    const searchQuery = encodeURIComponent(`${companyName} ISO 인증`);
    const newsUrl = `https://search.naver.com/search.naver?where=news&query=${searchQuery}`;

    const response = await axios.get(newsUrl, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    // Naver 뉴스 검색 결과 선택자
    const newsItems = $(
      ".news_item, .news-item, .api_list_item, [data-news-item]"
    );

    newsItems.each((_, element) => {
      const $item = $(element);

      const title =
        $item.find(".news_tit, .title, h3, [data-title]").text() ||
        $item.find("a").text() ||
        "";
      const url =
        $item.find(".news_tit, a").attr("href") ||
        $item.find("[data-url]").attr("data-url") ||
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
 */
export async function scrapeNaverBlog(
  companyName: string
): Promise<ScrapedCertification[]> {
  try {
    const results: ScrapedCertification[] = [];

    const searchQuery = encodeURIComponent(`${companyName} ISO 인증`);
    const blogUrl = `https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=${searchQuery}`;

    const response = await axios.get(blogUrl, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    // 블로그 포스트 선택자
    const posts = $(
      ".post_item, .blog_item, [data-post-item], .search_result_item"
    );

    posts.each((_, element) => {
      const $post = $(element);

      const title =
        $post.find(".post_tit, .title, h3, [data-title]").text() ||
        $post.find("a").text() ||
        "";
      const url =
        $post.find(".post_tit, a").attr("href") ||
        $post.find("[data-url]").attr("data-url") ||
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

  // 일반적인 인증기관 이름 패턴
  const certBodyPatterns = [
    "한국표준협회",
    "KSA",
    "로이드",
    "LRQA",
    "DQS",
    "TUV",
    "DNV",
    "BV",
    "ABS",
    "RINA",
  ];

  for (const pattern of certBodyPatterns) {
    if (title.includes(pattern)) {
      certBodies.push({ name: pattern });
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
  const certBodies: Array<{ name: string; code?: string }> = [];

  const certBodyPatterns = [
    { name: "한국표준협회", code: "KSA" },
    { name: "로이드", code: "LRQA" },
    { name: "DQS", code: "DQS" },
    { name: "TUV", code: "TUV" },
    { name: "DNV", code: "DNV" },
  ];

  for (const pattern of certBodyPatterns) {
    if (text.includes(pattern.name) || text.includes(pattern.code)) {
      certBodies.push(pattern);
    }
  }

  return certBodies;
}

