import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ko" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ko: {
    "app.title": "ISO 인증정보 검색 시스템",
    "app.description": "회사명을 입력하면 ISO 인증 정보를 검색합니다. 모든 정보는 공개된 출처에서 수집됩니다.",
    "search.placeholder": "회사명을 입력하세요 (예: 삼성전자, LG전자)",
    "search.button": "검색",
    "search.title": "ISO 인증 정보 검색",
    "search.subtitle": "글로벌 기업의 ISO 인증 정보를 검색하세요",
    "search.searching": "검색 중...",
    "search.noResults": "검색 결과가 없습니다.",
    "search.noResultsHint": "다른 회사명으로 검색해보세요.",
    "search.results": "검색 결과",
    "cert.types": "ISO 인증 종류",
    "cert.bodies": "인증기관",
    "cert.issuedDate": "인증 발급일",
    "cert.expiryDate": "인증 만료일",
    "cert.sources": "정보 출처",
    "cert.status.valid": "유효",
    "cert.status.expired": "만료",
    "cert.status.unknown": "미확인",
    "info.publicData": "공개 데이터 기반",
    "info.publicDataDesc": "KSA, KCN 등 공식 인증 기관의 공개 정보를 기반으로 검색합니다.",
    "info.sources": "출처 명시",
    "info.sourcesDesc": "모든 검색 결과에 정보 출처를 명확히 표시합니다.",
    "info.reliable": "신뢰할 수 있는 정보",
    "info.reliableDesc": "최신 인증 정보를 제공하고 정기적으로 업데이트합니다.",
  },
  en: {
    "app.title": "ISO Certification Information Search System",
    "app.description":
      "Search for ISO certification information by entering a company name. All information is collected from publicly available sources.",
    "search.placeholder": "Enter company name (e.g., Samsung Electronics, LG Electronics)",
    "search.button": "Search",
    "search.title": "ISO Certification Information Search",
    "search.subtitle": "Search for ISO certification information of Global companies",
    "search.searching": "Searching...",
    "search.noResults": "No search results found.",
    "search.noResultsHint": "Try searching with a different company name.",
    "search.results": "Search Results",
    "cert.types": "ISO Certification Types",
    "cert.bodies": "Certification Bodies",
    "cert.issuedDate": "Certification Issued Date",
    "cert.expiryDate": "Certification Expiry Date",
    "cert.sources": "Information Sources",
    "cert.status.valid": "Valid",
    "cert.status.expired": "Expired",
    "cert.status.unknown": "Unknown",
    "info.publicData": "Based on Public Data",
    "info.publicDataDesc":
      "Search based on public information from official certification agencies such as KSA and KCN.",
    "info.sources": "Clear Source Attribution",
    "info.sourcesDesc": "All search results clearly indicate the source of information.",
    "info.reliable": "Reliable Information",
    "info.reliableDesc": "Provides the latest certification information and is regularly updated.",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ko");

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem("language") as Language | null;
    if (saved && (saved === "ko" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

