# 🤖 GPT-4o-mini 뉴스 분석 기능 가이드

## 📋 개요

이 시스템은 **ChatGPT (GPT-4o-mini)**를 사용하여 뉴스 본문에서 ISO 인증 정보를 자동으로 추출합니다.

### 🎯 핵심 기능: 하이브리드 방식 (방안 3)

1. **즉시 응답**: 사용자는 캐시, DB, 기본 스크래핑 결과를 즉시 받음
2. **백그라운드 분석**: GPT가 뉴스 본문을 분석하여 캐시를 개선
3. **점진적 개선**: 다음 검색 시 더 정확한 인증기관 정보 제공

## 🌍 다국어 지원

- **한국어**: 한국 회사 검색 시 자동으로 한국어 뉴스 분석
- **영어**: 영어 회사 검색 시 자동으로 영어 뉴스 분석
- GPT-4o-mini가 언어를 자동 인식하여 처리

## 🚀 설정 방법

### 1. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 회원가입/로그인
2. [API Keys](https://platform.openai.com/api-keys) 페이지로 이동
3. "Create new secret key" 클릭
4. 키 이름 입력 (예: "ISO-Search-System")
5. API 키 복사 (sk-로 시작)

### 2. 환경 변수 설정

#### Netlify에서 설정:
1. Netlify 대시보드 → Site settings → Environment variables
2. 새 변수 추가:
   - Key: `LLM_API_KEY`
   - Value: `sk-...` (복사한 API 키)
3. 배포 다시 실행

#### 로컬 개발:
```bash
# .env 파일 생성
echo "LLM_API_KEY=sk-..." > .env
```

## 💰 비용 안내

### GPT-4o-mini 가격 (2024년 기준)

- **입력**: $0.150 / 1M tokens
- **출력**: $0.600 / 1M tokens

### 실제 사용 비용

#### 검색 1회당:
- 뉴스 3개 분석
- 입력: ~4,000 tokens (뉴스 본문)
- 출력: ~500 tokens (JSON 결과)
- **비용: 약 $0.001-0.002** (0.1-0.2 센트)

#### 월 예상 비용:
- 월 100회 검색: **~$0.15**
- 월 1,000회 검색: **~$1.50**
- 월 10,000회 검색: **~$15**

> **결론**: 매우 저렴합니다! 🎉

## 🔧 작동 방식

### 1. 사용자 검색
```
사용자 → "삼성전자" 검색
```

### 2. 즉시 응답 (< 5초)
```
✅ 캐시 확인
✅ 데이터베이스 검색
✅ Google News 스크래핑 (제목만)
→ 즉시 결과 반환
```

### 3. 백그라운드 분석 (비동기)
```
🔄 상위 3개 뉴스 선택
🔄 각 뉴스 본문 다운로드
🤖 GPT-4o-mini 분석:
   - ISO 인증 종류 추출
   - 인증기관 정보 추출
   - 발급일/만료일 추출
   - 상태 판단
✅ 캐시 업데이트
```

### 4. 다음 검색
```
사용자 → "삼성전자" 재검색
→ 개선된 캐시 결과 즉시 반환 (인증기관 정보 포함!)
```

## 📊 추출 정보

GPT-4o-mini가 뉴스에서 추출하는 정보:

```json
{
  "certificationTypes": ["ISO 9001:2015", "ISO 14001:2015"],
  "certificationBodies": [
    {"name": "Korean Standards Association (KSA)", "code": "KSA"},
    {"name": "TÜV", "code": "TUV"}
  ],
  "issuedDate": "2024-01-15",
  "expiryDate": "2027-01-14",
  "status": "valid"
}
```

## 🎯 성능 최적화

### Netlify 무료 플랜 (10초 제한)
- ✅ 즉시 응답: 3-5초
- ✅ 백그라운드 GPT: 비동기 (사용자 대기 불필요)
- ✅ 캐시 활용: 24시간

### 타임아웃 관리
```typescript
// 뉴스 다운로드: 3초
const response = await axios.get(newsUrl, { timeout: 3000 });

// GPT 분석: 모델이 빠름 (gpt-4o-mini)
const gptResponse = await invokeLLM({
  model: "gpt-4o-mini",
  max_tokens: 500
});
```

## 🔍 테스트 방법

### 1. OpenAI API 키 없이 테스트
```
→ 기본 스크래핑만 작동 (제목에서 패턴 매칭)
→ 인증기관 정보 제한적
```

### 2. OpenAI API 키와 함께 테스트
```
1. 첫 검색: 기본 결과 즉시 반환
2. 콘솔 확인: "[Background GPT] Starting analysis..."
3. 1-2분 후 재검색: 개선된 결과 (인증기관 포함!)
```

### 3. 로그 확인

브라우저 콘솔(F12)에서 확인:
```
[Background GPT] Starting analysis for: 삼성전자
[GPT Analysis] Analyzing news: https://...
[LLM] API call starting... { model: 'gpt-4o-mini' }
[GPT Analysis] Success: { certTypes: 2, certBodies: 2 }
[Background GPT] Successfully updated cache with 3 GPT-analyzed results
```

## 🚨 문제 해결

### API 키가 작동하지 않는 경우
```bash
# 환경 변수 확인
echo $LLM_API_KEY

# Netlify에서: 환경 변수 재배포 필요
netlify deploy --prod
```

### GPT 분석이 실행되지 않는 경우
1. 뉴스 URL 확인: Google News만 지원
2. 콘솔 에러 확인: API 키, 네트워크 등
3. OpenAI 계정 크레딧 확인

### 비용이 걱정되는 경우
```typescript
// webScraper.ts에서 분석 개수 조정
export async function analyzeMultipleNewsWithGPT(
  newsUrls: string[],
  companyName: string,
  maxCount: number = 3  // ← 1이나 2로 줄이기
)
```

## 📈 기대 효과

### Before (GPT 없음)
```
삼성전자 검색 결과:
- ISO 9001:2015 ✓
- ISO 14001:2015 ✓
- 인증기관: ❌ (알 수 없음)
```

### After (GPT 활용)
```
삼성전자 검색 결과:
- ISO 9001:2015 ✓
- ISO 14001:2015 ✓
- 인증기관: ✓ TÜV, KSA, Lloyd's Register
- 발급일: ✓ 2022-06-10
- 만료일: ✓ 2025-06-09
```

## 🌟 추가 개선 아이디어

1. **모델 업그레이드**: gpt-4o-mini → gpt-4o (더 정확, 조금 비쌈)
2. **분석 개수 증가**: 3개 → 5개 뉴스 분석
3. **실시간 분석**: 백그라운드 대신 즉시 분석 (Pro 플랜 필요)
4. **주기적 업데이트**: 매일 자동으로 캐시 갱신

---

## 📞 문의

구현 완료! 이제 뉴스 본문에서 인증기관 정보를 자동으로 추출합니다. 🎉

**저장소**: https://github.com/neod00/ISO-Certification-Search-System

