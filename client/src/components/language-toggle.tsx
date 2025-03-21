import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = async () => {
    try {
      const nextLang = currentLang === 'en' ? 'zh' : 'en';
      await i18n.changeLanguage(nextLang);
      setCurrentLang(nextLang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className="fixed top-4 right-4"
      title={currentLang === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}