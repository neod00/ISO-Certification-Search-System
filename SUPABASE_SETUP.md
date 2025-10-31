# Supabase (PostgreSQL) 설정 가이드

이 프로젝트는 Supabase PostgreSQL 데이터베이스를 사용합니다.

## 1. Supabase 데이터베이스 생성

1. [Supabase](https://supabase.com/) 가입 및 로그인
2. "New project" 클릭
3. 프로젝트 정보 입력:
   - Name: `iso-certification-db` (원하는 이름)
   - Database Password: 강력한 비밀번호 생성 (저장 필수!)
   - Region: `Northeast Asia (Seoul)` 또는 가까운 지역
4. "Create new project" 클릭

## 2. 데이터베이스 연결 정보 확인

1. 프로젝트 대시보드 → Settings (⚙️ 아이콘)
2. 왼쪽 메뉴에서 "Database" 클릭
3. "Connection string" 섹션에서:
   - "URI" 탭 선택
   - Connection string 복사 (형식: `postgresql://...`)
   - `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

예시:
```
postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

## 3. 테이블 생성

Supabase 대시보드에서:
1. 왼쪽 메뉴 → "SQL Editor" 클릭
2. "New query" 클릭
3. 아래 SQL을 복사하여 실행:

### 3.1. Enum 타입 생성

```sql
-- Role enum
CREATE TYPE role AS ENUM ('user', 'admin');

-- Status enum
CREATE TYPE status AS ENUM ('valid', 'expired', 'unknown');
```

### 3.2. Users 테이블

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role role DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_users_openid ON users("openId");
```

### 3.3. ISO Certifications 테이블

```sql
CREATE TABLE IF NOT EXISTS iso_certifications (
  id SERIAL PRIMARY KEY,
  "companyName" VARCHAR(255) NOT NULL,
  "companyNameEn" VARCHAR(255),
  "certificationTypes" TEXT NOT NULL,
  "certificationBodies" TEXT NOT NULL,
  "issuedDate" VARCHAR(10),
  "expiryDate" VARCHAR(10),
  status status DEFAULT 'unknown' NOT NULL,
  sources TEXT NOT NULL,
  "lastUpdated" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for company name search
CREATE INDEX idx_certifications_company ON iso_certifications("companyName");
CREATE INDEX idx_certifications_company_lower ON iso_certifications(LOWER("companyName"));
```

### 3.4. Search Cache 테이블

```sql
CREATE TABLE IF NOT EXISTS search_cache (
  id SERIAL PRIMARY KEY,
  "searchQuery" VARCHAR(255) NOT NULL UNIQUE,
  results TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for faster cache lookups
CREATE INDEX idx_cache_query ON search_cache("searchQuery");
CREATE INDEX idx_cache_expiry ON search_cache("expiresAt");
```

### 3.5. 트리거 생성 (자동 updatedAt)

```sql
-- Function to update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for iso_certifications table
CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON iso_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 4. Netlify 환경 변수 설정

1. Netlify 대시보드 → 사이트 선택
2. Site settings → Environment variables
3. "Add a variable" 클릭
4. 변수 추가:
   - **Key**: `DATABASE_URL`
   - **Value**: Supabase에서 복사한 연결 문자열 (비밀번호 포함)
   - **Scope**: All scopes
5. "Add variable" 클릭
6. "Trigger deploy"로 재배포

## 5. 연결 확인

배포 후:
1. Netlify 대시보드 → Functions → Logs 확인
2. `[Database] PostgreSQL connection created successfully` 로그 확인
3. 사이트에서 검색 버튼이 활성화되는지 확인

## 6. Supabase 추가 설정 (선택 사항)

### Row Level Security (RLS) 비활성화

테이블이 서버 측에서만 접근되므로 RLS를 비활성화할 수 있습니다:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE iso_certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache DISABLE ROW LEVEL SECURITY;
```

### 백업 설정

Supabase는 자동으로 일일 백업을 제공합니다. Settings → Database → Backups에서 확인 가능합니다.

## 7. 문제 해결

### 연결 오류가 발생하는 경우

1. **비밀번호 확인**: 연결 문자열의 `[YOUR-PASSWORD]`를 실제 비밀번호로 교체했는지 확인
2. **포트 확인**: Supabase는 기본적으로 포트 6543 사용 (Connection Pooling)
3. **직접 연결**: Connection Pooling 대신 Direct Connection 사용 시도
   - Settings → Database → Connection string → "Direct connection" 탭
4. **Netlify 로그 확인**: Functions → Logs에서 에러 메시지 확인

### 테이블 생성 오류

- Enum 타입을 먼저 생성했는지 확인
- 쿼리를 하나씩 실행하여 어느 부분에서 오류가 발생하는지 확인

### 성능 이슈

Supabase 무료 플랜:
- 500MB 데이터베이스
- 무제한 API 요청
- 50,000 월간 Realtime 연결

더 많은 리소스가 필요하면 Pro 플랜($25/월) 고려

## 8. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Drizzle ORM PostgreSQL 가이드](https://orm.drizzle.team/docs/get-started-postgresql)

