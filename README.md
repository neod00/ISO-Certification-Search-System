# ISO 인증정보 검색 시스템

한국 기업의 ISO 인증 정보를 검색하는 웹 애플리케이션입니다.

## 🌟 주요 기능

- **다중 소스 검색**: KSA, Google News, Naver News, 블로그 등 여러 출처에서 정보 수집
- **🆕 ChatGPT 뉴스 분석**: GPT-4o-mini를 사용하여 뉴스 본문에서 인증기관 정보 자동 추출 (한국어/영어 자동 지원)
- **하이브리드 검색**: 즉시 응답 제공 + 백그라운드에서 GPT 분석으로 캐시 개선
- **데이터베이스 캐싱**: 빠른 응답을 위한 검색 결과 24시간 캐싱
- **다국어 지원**: 한국어/영어 자동 감지 및 지원
- **다크 모드**: 라이트/다크 테마 전환 지원

## 🚀 배포하기

### 방법 1: Netlify 배포 (추천 - 무료 플랜)

#### 1. 프로젝트 준비

```bash
# 저장소 클론
git clone https://github.com/neod00/ISO-Certification-Search-System.git
cd ISO-Certification-Search-System

# 의존성 설치
npm install
```

#### 2-A. Netlify CLI로 배포

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# Netlify 로그인
netlify login

# 배포
netlify deploy --prod
```

#### 2-B. Netlify 대시보드에서 배포

1. [Netlify](https://app.netlify.com/) 로그인
2. "Add new site" → "Import an existing project" 클릭
3. GitHub 저장소 연결: `neod00/ISO-Certification-Search-System`
4. 빌드 설정 (자동으로 `netlify.toml`에서 읽어옴)
5. "Deploy site" 클릭

#### 3. 환경 변수 설정

Netlify 대시보드 → Site settings → Environment variables에서 설정:

**필수 환경 변수:**
- `DATABASE_URL`: PostgreSQL 데이터베이스 연결 문자열 (Supabase)
  ```
  postgresql://postgres.xxx:[password]@xxx.supabase.com:6543/postgres
  ```

**선택 환경 변수 (권장):**
- `LLM_API_KEY`: OpenAI API 키 (GPT-4o-mini 사용)
  - [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급
  - 뉴스 본문 분석으로 인증기관 정보 정확도 향상
  - 비용: 약 $0.003-0.005/검색 (매우 저렴)

#### 4. Netlify 최적화 설정

- **함수 타임아웃**: 10초 (무료 플랜)
- **캐싱 전략**: 첫 검색 후 DB 캐싱으로 빠른 응답
- **타임아웃 최적화**: 웹 스크래핑 4초로 제한

---

### 방법 2: Vercel 배포

#### 1. Vercel CLI 설치 및 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel 로그인
vercel login

# 배포
vercel
```

#### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

- `DATABASE_URL`: PostgreSQL 연결 문자열 (Supabase)
- `LLM_API_KEY`: OpenAI API 키 (GPT-4o-mini 사용, 권장)

> **참고**: Vercel은 무료 플랜에서 10초 제한, Pro 플랜($20/월)에서 60초 제한

---

### 공통: 데이터베이스 설정

PostgreSQL 데이터베이스가 필요합니다. **Supabase 사용을 권장합니다** (무료 플랜):

- [Supabase](https://supabase.com/) (추천 - 무료 플랜, PostgreSQL)
- [Neon](https://neon.tech/) (무료 플랜, PostgreSQL)
- [Railway](https://railway.app/) (PostgreSQL 지원)
- AWS RDS PostgreSQL

#### 데이터베이스 스키마 생성

**상세 가이드**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참조

간단 요약:
1. Supabase에서 프로젝트 생성
2. SQL Editor에서 테이블 생성 스크립트 실행 (SUPABASE_SETUP.md 참조)
3. 연결 문자열을 Netlify 환경 변수에 추가

## 🛠 기술 스택

### 프론트엔드
- React + TypeScript
- Wouter (라우팅)
- Tailwind CSS
- shadcn/ui

### 백엔드
- tRPC
- Drizzle ORM
- PostgreSQL (Supabase)
- Node.js

### 웹 스크래핑
- Axios
- Cheerio

### 배포
- Netlify (서버리스 - 추천)
- Vercel (서버리스)

## 📁 프로젝트 구조

```
ISO-Certification-Search-System/
├── netlify/                   # Netlify 서버리스 함수
│   └── functions/
│       └── trpc.ts           # tRPC API 핸들러 (Netlify)
├── api/                       # Vercel 서버리스 함수
│   └── trpc/
│       └── [trpc].ts         # tRPC API 핸들러 (Vercel)
├── drizzle/                   # 데이터베이스 스키마 및 마이그레이션
│   └── schema.ts
├── src/
│   ├── components/            # React 컴포넌트
│   ├── contexts/              # React Context (언어, 테마)
│   ├── pages/                 # 페이지 컴포넌트
│   └── lib/                   # 유틸리티 함수
├── server/
│   ├── routers.ts             # tRPC 라우터
│   ├── db.ts                  # 데이터베이스 연결 (연결 풀링)
│   ├── isoSearch.ts           # ISO 검색 로직
│   └── webScraper.ts          # 웹 스크래핑 모듈
├── netlify.toml               # Netlify 설정
├── vercel.json                # Vercel 설정
├── .gitignore
├── .env.example               # 환경 변수 예시
└── package.json
```

## 🔧 로컬 개발

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 🌐 환경 변수

`.env.example` 파일을 `.env`로 복사하고 필요한 값을 설정하세요:

```bash
cp .env.example .env
```

## 📊 성능 최적화

- **연결 풀링**: MySQL 연결 풀을 사용해 서버리스 환경에 최적화
- **캐싱**: 검색 결과를 24시간 캐싱 (첫 검색 후 즉시 응답)
- **타임아웃 제어**: 
  - Netlify: 4초로 제한 (10초 함수 타임아웃)
  - Vercel: 8초로 제한 (10초/60초 함수 타임아웃)
- **병렬 처리**: 웹 스크래핑 및 LLM 검색을 병렬로 실행
- **점진적 로딩**: 캐시 우선 전략으로 빠른 사용자 경험

## 📝 주요 API

### ISO 인증 검색

```typescript
// tRPC 쿼리
const result = trpc.iso.search.useQuery({
  companyName: "삼성전자"
});
```

**응답 형식:**
```json
{
  "results": [
    {
      "companyName": "삼성전자",
      "certificationTypes": ["ISO 9001:2015", "ISO 14001:2015"],
      "certificationBodies": [
        { "name": "KSA", "code": "KR001" }
      ],
      "issuedDate": "2023-01-15",
      "expiryDate": "2026-01-14",
      "status": "valid",
      "sources": [
        {
          "url": "https://...",
          "source": "KSA",
          "retrievedAt": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "fromCache": false,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 📞 문의

프로젝트 링크: [https://github.com/neod00/ISO-Certification-Search-System](https://github.com/neod00/ISO-Certification-Search-System)

## 🎯 향후 계획

- [ ] 검색 결과 필터링 및 정렬
- [ ] 인증기관별 검색
- [ ] 배치 검색 기능 (CSV 업로드)
- [ ] 모바일 앱 개발
- [ ] RESTful API 제공
- [ ] Puppeteer를 사용한 동적 웹사이트 스크래핑

