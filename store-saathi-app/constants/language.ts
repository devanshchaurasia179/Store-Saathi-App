export const LANGUAGES = [
  {
    code: 'hi',
    title: 'हिंदी',
    symbol: 'अ',
    bgColor: '#E3F2FD', // Light Blue
    symbolColor: '#2196F3', 
  },
  {
    code: 'en',
    title: 'English',
    symbol: 'A',
    bgColor: '#E8F5E9', // Light Green
    symbolColor: '#4CAF50',
  },
  {
    code: 'pa',
    title: 'Punjabi-ਪੰਜਾਬੀ',
    symbol: 'ਅ',
    bgColor: '#FFF3E0', // Light Peach
    symbolColor: '#FF9800',
  },
  {
    code: 'gu',
    title: 'Gujarati-ગુજરાતી',
    symbol: 'અ',
    bgColor: '#FFE0B2', // Light Orange
    symbolColor: '#E65100',
  },
  {
    code: 'mr',
    title: 'Marathi-मराठी',
    symbol: 'आ',
    bgColor: '#E0F2F1', // Light Mint
    symbolColor: '#FF5722',
  },
  {
    code: 'te',
    title: 'Telugu-తెలుగు',
    symbol: 'అ',
    bgColor: '#FFFDE7', // Light Yellow
    symbolColor: '#C6A700',
  },
];

export const LANGUAGE_TEXT: any = {
  en: {
    // Language Page
    chooseLanguageTitle: "Choose Language",
    chooseLanguageHindi: "Choose your preferred language",

    // Login Page
    loginTitle: "Login / Register",
    mobilePlaceholder: "Enter mobile number",
    sendOtp: "Send OTP",

    // OTP Page
    verifyOtpTitle: "Verify OTP",
    otpPlaceholder: "Enter 6-digit OTP",
    verifyOtp: "Verify OTP",
    otpSentTo: "OTP sent to",

    // Errors / Messages
    invalidMobile: "Enter a valid 10-digit mobile number",
    invalidOtp: "Enter valid 6-digit OTP",
    somethingWentWrong: "Something went wrong",
    otpSentSuccess: "OTP sent successfully",
    loginSuccess: "Login successful",
  },

  hi: {
    chooseLanguageTitle: "भाषा चुनें",
    chooseLanguageHindi: "अपनी भाषा चुनें",

    loginTitle: "लॉगिन / रजिस्टर",
    mobilePlaceholder: "मोबाइल नंबर दर्ज करें",
    sendOtp: "ओटीपी भेजें",

    verifyOtpTitle: "ओटीपी सत्यापित करें",
    otpPlaceholder: "6 अंकों का ओटीपी दर्ज करें",
    verifyOtp: "ओटीपी सत्यापित करें",
    otpSentTo: "ओटीपी भेजा गया",

    invalidMobile: "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें",
    invalidOtp: "मान्य 6 अंकों का ओटीपी दर्ज करें",
    somethingWentWrong: "कुछ गलत हो गया",
    otpSentSuccess: "ओटीपी सफलतापूर्वक भेजा गया",
    loginSuccess: "लॉगिन सफल",
  },

  pa: {
    chooseLanguageTitle: "ਭਾਸ਼ਾ ਚੁਣੋ",
    chooseLanguageHindi: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",

    loginTitle: "ਲੌਗਿਨ / ਰਜਿਸਟਰ",
    mobilePlaceholder: "ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
    sendOtp: "OTP ਭੇਜੋ",

    verifyOtpTitle: "OTP ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    otpPlaceholder: "6 ਅੰਕਾਂ ਦਾ OTP ਦਰਜ ਕਰੋ",
    verifyOtp: "OTP ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    otpSentTo: "OTP ਭੇਜਿਆ ਗਿਆ",

    invalidMobile: "ਵੈਧ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
    invalidOtp: "ਵੈਧ 6 ਅੰਕਾਂ ਦਾ OTP ਦਰਜ ਕਰੋ",
    somethingWentWrong: "ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ",
    otpSentSuccess: "OTP ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ",
    loginSuccess: "ਲੌਗਿਨ ਸਫਲ",
  },

  gu: {
    chooseLanguageTitle: "ભાષા પસંદ કરો",
    chooseLanguageHindi: "તમારી ભાષા પસંદ કરો",

    loginTitle: "લોગિન / રજિસ્ટર",
    mobilePlaceholder: "મોબાઇલ નંબર દાખલ કરો",
    sendOtp: "OTP મોકલો",

    verifyOtpTitle: "OTP ચકાસો",
    otpPlaceholder: "6 અંકનો OTP દાખલ કરો",
    verifyOtp: "OTP ચકાસો",
    otpSentTo: "OTP મોકલ્યો",

    invalidMobile: "માન્ય 10 અંકનો મોબાઇલ નંબર દાખલ કરો",
    invalidOtp: "માન્ય 6 અંકનો OTP દાખલ કરો",
    somethingWentWrong: "કંઈક ખોટું થયું",
    otpSentSuccess: "OTP સફળતાપૂર્વક મોકલ્યો",
    loginSuccess: "લોગિન સફળ",
  },

  mr: {
    chooseLanguageTitle: "भाषा निवडा",
    chooseLanguageHindi: "आपली भाषा निवडा",

    loginTitle: "लॉगिन / नोंदणी",
    mobilePlaceholder: "मोबाइल नंबर टाका",
    sendOtp: "OTP पाठवा",

    verifyOtpTitle: "OTP पडताळा",
    otpPlaceholder: "6 अंकी OTP टाका",
    verifyOtp: "OTP पडताळा",
    otpSentTo: "OTP पाठवला",

    invalidMobile: "वैध 10 अंकी मोबाइल नंबर टाका",
    invalidOtp: "वैध 6 अंकी OTP टाका",
    somethingWentWrong: "काहीतरी चूक झाली",
    otpSentSuccess: "OTP यशस्वीरित्या पाठवला",
    loginSuccess: "लॉगिन यशस्वी",
  },

  te: {
    chooseLanguageTitle: "భాషను ఎంచుకోండి",
    chooseLanguageHindi: "మీ భాషను ఎంచుకోండి",

    loginTitle: "లాగిన్ / నమోదు",
    mobilePlaceholder: "మొబైల్ నంబర్ నమోదు చేయండి",
    sendOtp: "OTP పంపండి",

    verifyOtpTitle: "OTP ధృవీకరించండి",
    otpPlaceholder: "6 అంకెల OTP నమోదు చేయండి",
    verifyOtp: "OTP ధృవీకరించండి",
    otpSentTo: "OTP పంపబడింది",

    invalidMobile: "సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    invalidOtp: "సరైన 6 అంకెల OTP నమోదు చేయండి",
    somethingWentWrong: "ఏదో తప్పు జరిగింది",
    otpSentSuccess: "OTP విజయవంతంగా పంపబడింది",
    loginSuccess: "లాగిన్ విజయవంతం",
  },
};

