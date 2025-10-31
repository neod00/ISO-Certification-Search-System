import { getDb } from "./db";
import { isoCertifications } from "../drizzle/schema";

export interface SampleCertification {
  companyName: string;
  companyNameEn?: string;
  certificationTypes: string[];
  certificationBodies: string[];
  issuedDate: string;
  expiryDate: string;
  status: "valid" | "expired" | "unknown";
  sources: Array<{
    url: string;
    source: string;
  }>;
}

// 한국 주요 기업의 샘플 ISO 인증 데이터
const sampleData: SampleCertification[] = [
  {
    companyName: "일진전기",
    companyNameEn: "ILJIN Electric",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "로이드(LRQA)"],
    issuedDate: "2021-03-15",
    expiryDate: "2024-03-14",
    status: "expired",
    sources: [
      {
        url: "https://www.ilgjin.com/company/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "삼성전자",
    companyNameEn: "Samsung Electronics",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 50001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "DQS"],
    issuedDate: "2022-06-10",
    expiryDate: "2025-06-09",
    status: "valid",
    sources: [
      {
        url: "https://www.samsung.com/sec/sustainability/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "LG전자",
    companyNameEn: "LG Electronics",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "로이드(LRQA)"],
    issuedDate: "2021-09-20",
    expiryDate: "2024-09-19",
    status: "expired",
    sources: [
      {
        url: "https://www.lg.com/global/business/information/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "현대자동차",
    companyNameEn: "Hyundai Motor Company",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "DQS"],
    issuedDate: "2023-01-15",
    expiryDate: "2026-01-14",
    status: "valid",
    sources: [
      {
        url: "https://www.hyundai.com/quality/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "SK하이닉스",
    companyNameEn: "SK hynix",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015"],
    certificationBodies: ["한국표준협회(KSA)", "로이드(LRQA)"],
    issuedDate: "2022-04-10",
    expiryDate: "2025-04-09",
    status: "valid",
    sources: [
      {
        url: "https://www.skhynix.com/eng/about/quality",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "포스코",
    companyNameEn: "POSCO",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "DQS"],
    issuedDate: "2021-11-05",
    expiryDate: "2024-11-04",
    status: "expired",
    sources: [
      {
        url: "https://www.posco.co.kr/quality/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "네이버",
    companyNameEn: "NAVER",
    certificationTypes: ["ISO 27001:2013", "ISO 9001:2015"],
    certificationBodies: ["한국표준협회(KSA)", "로이드(LRQA)"],
    issuedDate: "2022-08-20",
    expiryDate: "2025-08-19",
    status: "valid",
    sources: [
      {
        url: "https://www.navercorp.com/company/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "카카오",
    companyNameEn: "Kakao",
    certificationTypes: ["ISO 27001:2013", "ISO 9001:2015"],
    certificationBodies: ["한국표준협회(KSA)", "DQS"],
    issuedDate: "2023-02-10",
    expiryDate: "2026-02-09",
    status: "valid",
    sources: [
      {
        url: "https://www.kakao.com/company/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "두산중공업",
    companyNameEn: "Doosan Heavy Industries",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "로이드(LRQA)"],
    issuedDate: "2021-07-15",
    expiryDate: "2024-07-14",
    status: "expired",
    sources: [
      {
        url: "https://www.doosanheavy.com/quality/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
  {
    companyName: "GS칼텍스",
    companyNameEn: "GS Caltex",
    certificationTypes: ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
    certificationBodies: ["한국표준협회(KSA)", "DQS"],
    issuedDate: "2022-05-20",
    expiryDate: "2025-05-19",
    status: "valid",
    sources: [
      {
        url: "https://www.gscaltex.com/quality/certification",
        source: "Company Website",
      },
      {
        url: "https://ksa.or.kr/search",
        source: "KSA Certification Database",
      },
    ],
  },
];

export async function seedDatabase() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Seed] Database not available");
      return;
    }

    console.log("[Seed] Starting database seeding...");

    for (const sample of sampleData) {
      const certTypesJson = JSON.stringify(sample.certificationTypes);
      const certBodiesJson = JSON.stringify(
        sample.certificationBodies.map((name) => ({ name }))
      );
      const sourcesJson = JSON.stringify(sample.sources);

      await db.insert(isoCertifications).values({
        companyName: sample.companyName,
        companyNameEn: sample.companyNameEn,
        certificationTypes: certTypesJson,
        certificationBodies: certBodiesJson,
        issuedDate: sample.issuedDate,
        expiryDate: sample.expiryDate,
        status: sample.status,
        sources: sourcesJson,
      });

      console.log(`[Seed] Added: ${sample.companyName} (${sample.companyNameEn || 'N/A'})`);
    }

    console.log("[Seed] Database seeding completed successfully!");
  } catch (error) {
    console.error("[Seed] Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (process.env.NODE_ENV !== 'production') {
  // Only run in development
  seedDatabase()
    .then(() => {
      console.log("[Seed] Database seeding completed!");
    })
    .catch((error) => {
      console.error("[Seed] Error:", error);
    });
}

