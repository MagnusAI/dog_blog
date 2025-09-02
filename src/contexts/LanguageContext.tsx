import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Supported languages
export type Language = 'da' | 'en';

// Translation resources type
type TranslationResources = {
  [key in Language]: {
    common: Record<string, any>;
    forms: Record<string, any>;
    pages: Record<string, any>;
  };
};

// Context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, namespace?: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('da'); // Danish as default
  const [resources, setResources] = useState<TranslationResources | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load translation resources
  const loadResources = async () => {
    try {
      setIsLoading(true);
      
      // Import all translation files using Vite's dynamic imports
      const [
        daCommon, daForms, daPages,
        enCommon, enForms, enPages
      ] = await Promise.all([
        import('../locales/da/common.json'),
        import('../locales/da/forms.json'),
        import('../locales/da/pages.json'),
        import('../locales/en/common.json'),
        import('../locales/en/forms.json'),
        import('../locales/en/pages.json')
      ]);

      const loadedResources: TranslationResources = {
        da: {
          common: daCommon.default,
          forms: daForms.default,
          pages: daPages.default
        },
        en: {
          common: enCommon.default,
          forms: enForms.default,
          pages: enPages.default
        }
      };

      setResources(loadedResources);
    } catch (error) {
      console.error('Failed to load translation resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize resources and load saved language
  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('kennel-language') as Language;
    if (savedLanguage && (savedLanguage === 'da' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
    
    loadResources();
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kennel-language', lang);
  };

  // Translation function with namespace support and parameter interpolation
  const t = (key: string, namespace: string = 'common', params?: Record<string, string | number>): string => {
    if (!resources) return key;

    const keys = key.split('.');
    let value: any = resources[language][namespace as keyof typeof resources[Language]];

    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        value = resources['en'][namespace as keyof typeof resources[Language]];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            console.warn(`Translation key not found: ${namespace}.${key} for language ${language}`);
            return key; // Return the key if translation not found
          }
        }
        break;
      }
    }

    // Handle non-string values
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${namespace}.${key}`);
      return key;
    }

    // Parameter interpolation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenience hook that returns only the translation function
export function useTranslation(namespace: string = 'common') {
  const { t, language, setLanguage, isLoading } = useLanguage();
  
  return {
    t: (key: string, paramsOrNamespace?: Record<string, string | number> | string, params?: Record<string, string | number>) => {
      // If second parameter is a string, it's a namespace
      if (typeof paramsOrNamespace === 'string') {
        return t(key, paramsOrNamespace, params);
      }
      // If second parameter is an object, it's parameters for the default namespace
      return t(key, namespace, paramsOrNamespace);
    },
    language,
    setLanguage,
    isLoading
  };
}
