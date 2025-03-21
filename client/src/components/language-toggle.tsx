import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className="fixed top-4 right-4"
      title={i18n.language === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}
