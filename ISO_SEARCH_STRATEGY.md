# ISO 인증정보 검색 전략 및 데이터 소스

## 1. 주요 공개 데이터 소스

### 1.1 KCN (Korea Certification Network)
- **URL**: https://eng.kab.or.kr/kor/kcn/kcn/forKcnSearch.do
- **기관**: 한국인정기구(KAB)
- **검색 방식**: 기업명 + 인증서번호로 검색
- **제공 정보**: 
  - 기업명 (Name of certified organization)
  - 인증서번호 (Certification number)
  - 인증 유효성 확인 정보
- **특징**: 공식 인증정보 DB, 신뢰도 높음
- **제한사항**: 인증서번호가 필요함, 1일 3회 검색 제한

### 1.2 한국표준협회(KSA) 인증기업 검색
- **URL**: https://ksa.or.kr/ksa_kr/876/subview.do
- **기관**: 한국표준협회 (KSA)
- **검색 방식**: 기업명으로 검색 가능
- **제공 정보**:
  - ISO 인증 종류 (ISO 9001, 14001 등)
  - 인증 유효 기간
  - 인증 상태 (유효/만료)
- **특징**: 기업명만으로 검색 가능, 사용자 친화적

### 1.3 KAB 인증기관 목록
- **URL**: https://www.kab.or.kr/kor/kcn/kcn/list.do
- **기관**: 한국인정기구(KAB)
- **제공 정보**:
  - 75개 이상의 인정 인증기관 목록
  - 각 기관별 인증 표준 현황
  - 기관 연락처 및 정보

### 1.4 개별 인증기관 검색 시스템
- **한국생산성본부인증원(KPC-QA)**: https://www.kpcqa.or.kr/
- **한국경영인증원(KMR)**: 개별 검색 시스템
- **로이드인증원(LRQA)**: 개별 검색 시스템
- **한국품질재단(KFQ)**: 개별 검색 시스템

## 2. 검색 전략

### 2.1 1차 검색: KSA 기업명 검색
- 사용자가 입력한 기업명으로 KSA 시스템 검색
- 기업명 자동완성 기능 활용
- 검색 결과에서 ISO 인증 정보 추출

### 2.2 2차 검색: 개별 인증기관 검색
- 1차 검색에서 찾은 인증기관 정보 활용
- 각 인증기관의 공개 검색 시스템 활용
- 더 상세한 인증 정보 수집

### 2.3 3차 검색: 웹 검색 및 뉴스
- Google/Naver 검색으로 회사 ISO 인증 관련 공시/뉴스 수집
- 회사 공식 홈페이지에서 인증 정보 확인
- 언론 보도자료 및 공시 정보 활용

## 3. 데이터 구조

```typescript
interface ISOCertification {
  companyName: string;           // 회사명
  certificationTypes: string[];  // ISO 인증 종류 (ISO 9001, 14001 등)
  certificationBodies: {         // 인증기관 정보
    name: string;                // 인증기관명
    code?: string;               // 인증기관 코드
  }[];
  certificationDates: {          // 인증 일자
    issued?: string;             // 인증 발급일
    expires?: string;            // 인증 만료일
  };
  sources: {                     // 출처 정보
    url: string;                 // 출처 URL
    source: string;              // 출처명 (KSA, KCN, 회사홈페이지 등)
    retrievedAt: string;         // 정보 수집 일자
  }[];
  status: 'valid' | 'expired' | 'unknown';  // 인증 상태
}
```

## 4. 구현 계획

### Phase 1: 데이터베이스 설계
- ISO 인증 정보 테이블 설계
- 검색 결과 캐싱 테이블 설계

### Phase 2: 웹 스크래핑 모듈 개발
- KSA 검색 시스템 스크래핑
- 개별 인증기관 검색 시스템 스크래핑
- 웹 검색 결과 수집

### Phase 3: 검색 API 개발
- tRPC 검색 프로시저 구현
- 다중 소스 검색 및 결과 통합

### Phase 4: 프론트엔드 UI 구현
- 검색 입력 폼
- 결과 표시 페이지
- 출처 링크 표시

## 5. 신뢰성 및 정확성 확보

### 5.1 출처 명시
- 모든 검색 결과에 출처 URL 명시
- 출처별 신뢰도 레벨 표시
- 정보 수집 일자 표시

### 5.2 정보 검증
- 공식 인증 DB(KCN, KSA)의 정보를 우선순위로 설정
- 여러 출처에서 동일한 정보 확인 시 신뢰도 증가
- 만료된 인증 정보 명확히 표시

### 5.3 정기적 업데이트
- 캐시된 정보의 유효기간 설정
- 정기적인 데이터 갱신 메커니즘

## 6. 법적/윤리적 고려사항

- 공개된 정보만 사용
- 개인정보 보호법 준수
- 웹 스크래핑 시 robots.txt 준수
- 각 사이트의 이용약관 준수

