# ISO 인증정보 검색 시스템

한국 기업의 ISO 인증 정보를 검색하는 웹 애플리케이션입니다.

## 🌟 주요 기능

- **다중 소스 검색**: KSA, Google News, Naver News, 블로그 등 여러 출처에서 정보 수집
- **LLM 기반 검색**: AI를 활용한 지능형 검색
- **데이터베이스 캐싱**: 빠른 응답을 위한 검색 결과 캐싱
- **다국어 지원**: 한국어/영어 지원
- **다크 모드**: 라이트/다크 테마 전환 지원

## 🚀 Vercel 배포하기

### 1. 프로젝트 준비

```bash
# 저장소 클론
git clone https://github.com/neod00/ISO-Certification-Search-System.git
cd ISO-Certification-Search-System

# 의존성 설치
npm install
```

### 2. Vercel CLI 설치 및 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel 로그인
vercel login

# 배포
vercel
```

### 3. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

#### 필수 환경 변수

- `DATABASE_URL`: MySQL 데이터베이스 연결 문자열
  ```
  mysql://username:password@host:3306/database
  ```

#### 선택 환경 변수

- `LLM_API_KEY`: LLM 서비스 API 키 (OpenAI, Anthropic 등)
- `NODE_ENV`: `production` (자동 설정됨)

### 4. 데이터베이스 설정

MySQL 데이터베이스가 필요합니다. 다음 서비스 중 하나를 사용하세요:

- [PlanetScale](https://planetscale.com/) (추천)
- [Railway](https://railway.app/)
- [Supabase](https://supabase.com/)
- AWS RDS

#### 데이터베이스 스키마 생성

```bash
# Drizzle 마이그레이션 실행
npm run db:migrate

# 샘플 데이터 추가 (선택)
npm run db:seed
```

## 🛠 기술 스택

### 프론트엔드
- React + TypeScript
- Wouter (라우팅)
- Tailwind CSS
- shadcn/ui

### 백엔드
- tRPC
- Drizzle ORM
- MySQL
- Node.js

### 웹 스크래핑
- Axios
- Cheerio

### 배포
- Vercel (서버리스)

## 📁 프로젝트 구조

```
ISO-Certification-Search-System/
├── api/                    # Vercel 서버리스 함수
│   └── [...trpc].ts        # tRPC API 핸들러
├── drizzle/                # 데이터베이스 스키마 및 마이그레이션
│   └── schema.ts
├── src/
│   ├── components/         # React 컴포넌트
│   ├── contexts/           # React Context (언어, 테마)
│   ├── pages/              # 페이지 컴포넌트
│   └── lib/                # 유틸리티 함수
├── server/
│   ├── routers.ts          # tRPC 라우터
│   ├── db.ts               # 데이터베이스 연결
│   ├── isoSearch.ts        # ISO 검색 로직
│   └── webScraper.ts       # 웹 스크래핑 모듈
├── vercel.json             # Vercel 설정
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
- **캐싱**: 검색 결과를 24시간 캐싱
- **타임아웃 제어**: Vercel 실행 시간 제한에 맞춘 타임아웃 설정
- **병렬 처리**: 웹 스크래핑 및 LLM 검색을 병렬로 실행

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

