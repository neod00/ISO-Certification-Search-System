import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface CertificationSource {
  url: string;
  source: string;
  retrievedAt: string;
}

interface CertificationResult {
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const searchQuery_val = trpc.iso.search.useQuery(
    { companyName: searchQuery },
    { enabled: shouldSearch && searchQuery.trim().length > 0 }
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    setShouldSearch(true);
  };

  const results = searchQuery_val.data?.results as CertificationResult[] | undefined;
  const isLoading = searchQuery_val.isLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`cert.status.${status}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("app.title")}
              </h1>
            </div>

            {/* Language and Theme Toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {language === "ko" ? "EN" : "KO"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">{t("app.description")}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search Form */}
        <Card className="mb-8 shadow-lg dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("search.title")}</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t("search.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !searchQuery.trim() || shouldSearch}
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  {t("search.button")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading && (
              <Card className="mb-8 dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("search.searching")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && (!results || results.length === 0) && (
              <Card className="mb-8 dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {t("search.noResults")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("search.noResultsHint")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("search.results")}
                  </h2>
                  <Badge variant="secondary">{results.length}</Badge>
                </div>

                {results.map((cert, idx) => (
                  <Card
                    key={idx}
                    className="shadow-md hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 dark:text-white">
                            {cert.companyName}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(cert.status)}
                            <Badge className={getStatusColor(cert.status)}>
                              {getStatusLabel(cert.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Certification Types */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          {t("cert.types")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cert.certificationTypes.map((type, i) => (
                            <Badge key={i} variant="outline">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Certification Bodies */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          {t("cert.bodies")}
                        </h3>
                        <div className="space-y-2">
                          {cert.certificationBodies.map((body, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded"
                            >
                              <span className="text-gray-900 dark:text-white">
                                {body.name}
                              </span>
                              {body.code && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({body.code})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        {cert.issuedDate && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {t("cert.issuedDate")}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(cert.issuedDate).toLocaleDateString(
                                language === "ko" ? "ko-KR" : "en-US"
                              )}
                            </p>
                          </div>
                        )}
                        {cert.expiryDate && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {t("cert.expiryDate")}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(cert.expiryDate).toLocaleDateString(
                                language === "ko" ? "ko-KR" : "en-US"
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Sources */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          {t("cert.sources")}
                        </h3>
                        <div className="space-y-2">
                          {cert.sources.map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 rounded transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">
                                  {source.source}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                                  {source.url}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        {!hasSearched && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">
                  {t("info.publicData")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("info.publicDataDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">
                  {t("info.sources")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("info.sourcesDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">
                  {t("info.reliable")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("info.reliableDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

