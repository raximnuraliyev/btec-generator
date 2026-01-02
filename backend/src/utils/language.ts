import { Language } from '@prisma/client';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  academicInstructions: string;
  formatInstructions: string;
}

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    academicInstructions: `Generate ALL content strictly in English.
Write in formal academic English suitable for BTEC education.
Use clear, professional language appropriate for educational guidance.
Do NOT mix languages. Do NOT translate from another language.
Write natively as an academic instructor would in English.`,
    formatInstructions: `Use standard English academic formatting:
- References: Oxford style
- Tables: English headers and content
- Images: English captions and descriptions`,
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    academicInstructions: `Создавайте ВСЁ содержимое СТРОГО на русском языке.
Пишите на формальном академическом русском языке, подходящем для образования BTEC.
Используйте ясный, профессиональный язык, соответствующий образовательному руководству.
НЕ смешивайте языки. НЕ переводите с другого языка.
Пишите естественно, как писал бы академический преподаватель на русском языке.`,
    formatInstructions: `Используйте стандартное академическое форматирование на русском языке:
- Ссылки: Оксфордский стиль (названия могут быть на английском, но описания на русском)
- Таблицы: Заголовки и содержание на русском
- Изображения: Подписи и описания на русском`,
  },
  uz: {
    code: 'uz',
    name: 'Uzbek',
    nativeName: "O'zbekcha",
    academicInstructions: `BARCHA kontentni FAQAT o'zbek tilida yarating.
BTEC ta'limiga mos rasmiy akademik o'zbek tilida yozing.
Ta'lim yo'riqnomasi uchun mos aniq, professional til ishlatilng.
Tillarni ARALASHTIRMANG. Boshqa tildan TARJIMA QILMANG.
O'zbek tilida akademik o'qituvchi kabi tabiiy yozing.`,
    formatInstructions: `O'zbek tilidagi standart akademik formatdan foydalaning:
- Havolalar: Oksford uslubi (nomlar ingliz tilida bo'lishi mumkin, lekin tavsiflar o'zbek tilida)
- Jadvallar: Sarlavhalar va tarkib o'zbek tilida
- Rasmlar: Taglavhalar va tavsiflar o'zbek tilida`,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    academicInstructions: `Genere todo el contenido estrictamente en español.
Escriba en español académico formal adecuado para la educación BTEC.
Use un lenguaje claro y profesional apropiado para orientación educativa.
NO mezcle idiomas. NO traduzca de otro idioma.
Escriba de forma natural como lo haría un instructor académico en español.`,
    formatInstructions: `Use formato académico estándar en español:
- Referencias: Estilo Oxford (los títulos pueden estar en inglés, pero las descripciones en español)
- Tablas: Encabezados y contenido en español
- Imágenes: Subtítulos y descripciones en español`,
  },
};

export const getLanguageConfig = (language: Language): LanguageConfig => {
  return LANGUAGE_CONFIGS[language];
};

export const getLanguagePromptInstructions = (language: Language): string => {
  const config = getLanguageConfig(language);
  return `${config.academicInstructions}

${config.formatInstructions}

⚠️ CRITICAL: If you respond in the wrong language, your response will be discarded.`;
};

export const validateLanguageResponse = (text: string, expectedLanguage: Language): boolean => {
  // Simple heuristic validation based on character patterns
  const checks: Record<Language, RegExp> = {
    en: /^[\x00-\x7F\s.,!?;:()\-'"]+$/i, // ASCII characters
    ru: /[а-яА-ЯёЁ]+/i, // Cyrillic characters
    uz: /[a-zA-Z']+/i, // Latin with apostrophe for Uzbek
    es: /[a-záéíóúüñÁÉÍÓÚÜÑ]+/i, // Spanish characters
  };

  const pattern = checks[expectedLanguage];
  
  // For Russian, check if there are Cyrillic characters
  if (expectedLanguage === 'ru') {
    return pattern.test(text);
  }
  
  // For Uzbek and Spanish, check character presence
  if (expectedLanguage === 'uz' || expectedLanguage === 'es') {
    return pattern.test(text);
  }
  
  // For English, majority should be ASCII
  if (expectedLanguage === 'en') {
    return pattern.test(text);
  }
  
  return true; // Default fallback
};
