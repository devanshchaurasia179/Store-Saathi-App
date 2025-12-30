import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LanguageContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: any) => {
  const [language, setLanguage] = useState("en");
  const [isReady, setIsReady] = useState(false); // Used to prevent UI flicker

  // 1. Load language from Storage on app launch
  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language:", error);
      } finally {
        setIsReady(true);
      }
    };
    loadStoredLanguage();
  }, []);

  // 2. Change language and Save to Storage
  const changeLanguage = async (lang: string) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isReady }}>
      {/* Optional: You can show a splash screen here while isReady is false */}
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};