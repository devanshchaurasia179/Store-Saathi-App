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
export const LANGUAGE_TEXT_PROFILE_CARD: any = {
  en: {
    greeting: "Namaste",
    ji: "Ji",
    partner: "Partner",
    myShop: "My Shop",
    profileCompletion: "Profile Completion",
    completeProfile: "Complete Profile",
    verifiedBusinessPartner: "VERIFIED BUSINESS PARTNER",
  },
  hi: {
    greeting: "नमस्ते",
    ji: "जी",
    partner: "पार्टनर",
    myShop: "मेरी दुकान",
    profileCompletion: "प्रोफ़ाइल पूर्णता",
    completeProfile: "प्रोफ़ाइल पूरी करें",
    verifiedBusinessPartner: "सत्यापित बिजनेस पार्टनर",
  },
  pa: {
    greeting: "नमस्ते",
    ji: "ਜੀ",
    partner: "ਪਾਰਟਨਰ",
    myShop: "ਮੇਰੀ ਦੁਕਾਨ",
    profileCompletion: "ਪ੍ਰੋਫਾਈਲ ਪੂਰਾ ਹੋਣਾ",
    completeProfile: "ਪ੍ਰੋਫਾਈਲ ਪੂਰਾ ਕਰੋ",
    verifiedBusinessPartner: "ਤਸਦੀਕਸ਼ੁਦਾ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰ",
  },
  gu: {
    greeting: "નમસ્તે",
    ji: "જી",
    partner: "ભાગીદાર",
    myShop: "મારી દુકાન",
    profileCompletion: "પ્રોફાઇલ પૂર્ણતા",
    completeProfile: "પ્રોફાઇલ પૂર્ણ કરો",
    verifiedBusinessPartner: "ચકાસાયેલ બિઝનેસ પાર્ટનર",
  },
  mr: {
    greeting: "नमस्ते",
    ji: "जी",
    partner: "भागीदार",
    myShop: "माझे दुकान",
    profileCompletion: "प्रोफाइल पूर्णता",
    completeProfile: "प्रोफाइल पूर्ण करा",
    verifiedBusinessPartner: "सत्यापित व्यवसाय भागीदार",
  },
  te: {
    greeting: "నమస్తే",
    ji: "గారు",
    partner: "భాగస్వామి",
    myShop: "నా దుకాణం",
    profileCompletion: "ప్రొఫైల్ పూర్తి",
    completeProfile: "ప్రొఫైల్‌ను పూర్తి చేయండి",
    verifiedBusinessPartner: "ధృవీకరించబడిన వ్యాపార భాగస్వామి",
  },
};

export const LANGUAGE_TEXT_DEBTOR_CARD: any = {
  en: {
    topDebtor: "Top Debtor",
    seeLedger: "See ledger",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `Dear ${name},\n\nThis is a gentle reminder from *${shopName}* that an amount of ₹${amount} is currently pending in your account.\n\nWe request you to kindly clear the balance at your convenience. Please feel free to contact us if you have any questions.\n\nThank you for your continued support.\n\nWarm regards,\n${shopName}\n Powered by Store Saathi`,
  },

  hi: {
    topDebtor: "सबसे बड़ा उधार",
    seeLedger: "खाता देखें",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `प्रिय ${name},\n\n*${shopName}* की ओर से यह एक विनम्र स्मरण है कि आपके खाते में ₹${amount} की राशि बकाया है।\n\nकृपया सुविधा अनुसार भुगतान करने की कृपा करें। किसी भी जानकारी के लिए आप हमसे संपर्क कर सकते हैं।\n\nआपके सहयोग के लिए धन्यवाद।\n\nसादर,\n${shopName}\n Powered by Store Saathi`,
  },

  pa: {
    topDebtor: "ਸਭ ਤੋਂ ਵੱਡਾ ਉਧਾਰ",
    seeLedger: "ਖਾਤਾ ਵੇਖੋ",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `ਸਤਿਕਾਰਯੋਗ ${name},\n\n*${shopName}* ਵੱਲੋਂ ਇਹ ਇੱਕ ਨਮ੍ਰ ਯਾਦ ਦਿਵਾਉਣਾ ਹੈ ਕਿ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ₹${amount} ਦੀ ਰਕਮ ਬਕਾਇਆ ਹੈ।\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸੁਵਿਧਾ ਅਨੁਸਾਰ ਭੁਗਤਾਨ ਕਰਨ ਦੀ ਮਿਹਰਬਾਨੀ ਕਰੋ। ਕਿਸੇ ਵੀ ਸਵਾਲ ਲਈ ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।\n\nਤੁਹਾਡੇ ਸਹਿਯੋਗ ਲਈ ਧੰਨਵਾਦ।\n\nਸਾਦਰ,\n${shopName} \n Powered by Store Saathi`,
  },

  gu: {
    topDebtor: "સૌથી વધુ ઉધાર",
    seeLedger: "ખાતું જુઓ",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `માનનીય ${name},\n\n*${shopName}* તરફથી આ એક વિનમ્ર યાદ અપાવવું છે કે તમારા ખાતામાં ₹${amount} ની રકમ બાકી છે.\n\nકૃપા કરીને તમારી સુવિધા મુજબ ચુકવણી કરવા વિનંતી. કોઈપણ પ્રશ્ન માટે અમારો સંપર્ક કરો.\n\nતમારા સહયોગ માટે આભાર.\n\nસાદર,\n${shopName}\n Powered by Store Saathi`,
  },

  mr: {
    topDebtor: "सर्वात मोठे कर्ज",
    seeLedger: "खाते पहा",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `आदरणीय ${name},\n\n*${shopName}* कडून ही एक नम्र आठवण आहे की आपल्या खात्यावर ₹${amount} इतकी रक्कम थकित आहे.\n\nकृपया आपल्या सोयीप्रमाणे भरणा करण्याची विनंती. काही शंका असल्यास आमच्याशी संपर्क साधा.\n\nआपल्या सहकार्याबद्दल धन्यवाद.\n\nआपला विश्वासू,\n${shopName}\n Powered by Store Saathi`,
  },

  te: {
    topDebtor: "అత్యధిక బాకీ",
    seeLedger: "లెడ్జర్ చూడండి",
    whatsappMsg: (
      name: string,
      amount: string,
      shopName: string
    ) =>
      `గౌరవనీయులైన ${name},\n\n*${shopName}* నుండి ఇది ఒక వినయపూర్వక గుర్తు. మీ ఖాతాలో ₹${amount} మొత్తము ఇంకా బాకీగా ఉంది.\n\nదయచేసి మీ సౌకర్యానుసారం చెల్లించగలరు. ఏవైనా సందేహాలు ఉంటే మమ్మల్ని సంప్రదించండి.\n\nమీ సహకారానికి ధన్యవాదాలు.\n\nఆదరాభిమానాలతో,\n${shopName}\n Powered by Store Saathi`,
  },
};

export const LANGUAGE_TEXT_QUICK_ACTIONS: any = {
  en: {
    inventory: "Inventory",
    ledger: "Ledger", // Using the traditional term in English script
    analytics: "Analytics",
    support: "Support",
  },
  hi: {
    inventory: "स्टॉक / माल",
    ledger: "बही खाता", // Bahi Khaata
    analytics: "रिपोर्ट्स",
    support: "सहायता",
  },
  pa: {
    inventory: "ਸਟਾਕ",
    ledger: "ਬਹੀ ਖਾਤਾ", // Bahi Khaata
    analytics: "ਰਿਪੋਰਟ",
    support: "ਮਦਦ",
  },
  gu: {
    inventory: "સ્ટોક",
    ledger: "વહી ખાતું", // Vahi Khatu
    analytics: "રિપોર્ટ્સ",
    support: "સહાય",
  },
  mr: {
    inventory: "स्टॉक",
    ledger: "बही खाते", // Bahi Khate
    analytics: "रिपोर्ट्स",
    support: "मदत",
  },
  te: {
    inventory: "స్టాక్",
    ledger: "చిట్టా పద్దులు", // Chitta Paddulu (Traditional Telugu Ledger term)
    analytics: "విశ్లేషణ",
    support: "సహాయం",
  },
};

export const LANGUAGE_TEXT_LOW_STOCK: any = {
  en: {
    lowStock: "Low Stock",
    qtyLeft: "Qty left",
    updateInventory: "Update inventory",
  },
  hi: {
    lowStock: "कम स्टॉक",
    qtyLeft: "बचा हुआ स्टॉक",
    updateInventory: "स्टॉक बढ़ाएं",
  },
  pa: {
    lowStock: "ਘੱਟ ਸਟਾਕ",
    qtyLeft: "ਬਾਕੀ ਸਟਾਕ",
    updateInventory: "ਸਟਾਕ ਅਪਡੇਟ ਕਰੋ",
  },
  gu: {
    lowStock: "ઓછો સ્ટોક",
    qtyLeft: "બાકી સ્ટોક",
    updateInventory: "સ્ટોક અપડેટ કરો",
  },
  mr: {
    lowStock: "कमी स्टॉक",
    qtyLeft: "शिल्लक नग",
    updateInventory: "स्टॉक अपडेट करा",
  },
  te: {
    lowStock: "తక్కువ స్టాక్",
    qtyLeft: "మిగిలిన నిల్వ",
    updateInventory: "స్టాక్ అప్‌డేట్ చేయండి",
  },
};

export const LANGUAGE_TEXT_MOST_SOLD: any = {
  en: {
    title: "Most Sold Products",
    viewAnalytics: "View analytics",
    sold: "sold",
    noData: "No sales data yet",
  },
  hi: {
    title: "सबसे ज़्यादा बिकने वाले सामान",
    viewAnalytics: "रिपोर्ट देखें",
    sold: "बिका",
    noData: "अभी तक कोई बिक्री नहीं हुई",
  },
  pa: {
    title: "ਸਭ ਤੋਂ ਵੱਧ ਵਿਕਣ ਵਾਲੇ ਸਾਮਾਨ",
    viewAnalytics: "ਰਿਪੋਰਟ ਵੇਖੋ",
    sold: "ਵਿਕਿਆ",
    noData: "ਅਜੇ ਤੱਕ ਕੋਈ ਵਿਕਰੀ ਨਹੀਂ ਹੋਈ",
  },
  gu: {
    title: "સૌથી વધુ વેચાતી વસ્તુઓ",
    viewAnalytics: "રિપોર્ટ જુઓ",
    sold: "વેચાયા",
    noData: "હજુ સુધી વેચાણનો કોઈ ડેટા નથી",
  },
  mr: {
    title: "सर्वात जास्त विक्री होणारे माल",
    viewAnalytics: "रिपोर्ट पहा",
    sold: "विकले",
    noData: "अद्याप विक्रीचा डेटा नाही",
  },
  te: {
    title: "ఎక్కువగా అమ్ముడైనవి",
    viewAnalytics: "విశ్లేషణ చూడండి",
    sold: "ఖర్చయ్యాయి",
    noData: "ఇంకా అమ్మకాల డేటా లేదు",
  },
};

export const LANGUAGE_TEXT_RECENT_BILLS: any = {
  en: {
    recentBills: "Recent Bills",
    seeMore: "See more",
    bill: "Bill",
    today: "Today",
    yesterday: "Yesterday",
  },
  hi: {
    recentBills: "हाल के बिल",
    seeMore: "और देखें",
    bill: "बिल",
    today: "आज",
    yesterday: "कल",
  },
  pa: {
    recentBills: "ਹਾਲੀਆ ਬਿੱਲ",
    seeMore: "ਹੋਰ ਵੇਖੋ",
    bill: "ਬਿੱਲ",
    today: "ਅੱਜ",
    yesterday: "ਕੱਲ੍ਹ",
  },
  gu: {
    recentBills: "તાજેતરના બિલ",
    seeMore: "વધુ જુઓ",
    bill: "બિલ",
    today: "આજે",
    yesterday: "ગઈકાલે",
  },
  mr: {
    recentBills: "अलीकडील बिले",
    seeMore: "अधिक पहा",
    bill: "बिल",
    today: "आज",
    yesterday: "काल",
  },
  te: {
    recentBills: "ఇటీవలి బిల్లులు",
    seeMore: "మరిన్ని చూడండి",
    bill: "బిల్లు",
    today: "ఈరోజు",
    yesterday: "నిన్న",
  },
};

export const LANGUAGE_TEXT_DASHBOARD: any = {
  en: {
    createBill: "Create Bill",
    testPrinter: "Connect Printer",
    errorFetch: "Could not load dashboard data",
  },

  hi: {
    createBill: "बिल बनाएं",
    testPrinter: "प्रिंटर जोड़ें",
    errorFetch: "डैशबोर्ड डेटा लोड नहीं हो सका",
  },

  pa: {
    createBill: "ਬਿੱਲ ਬਣਾਓ",
    testPrinter: "ਪ੍ਰਿੰਟਰ ਜੋੜੋ",
    errorFetch: "ਡੈਸ਼ਬੋਰਡ ਡੇਟਾ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ",
  },

  gu: {
    createBill: "બિલ બનાવો",
    testPrinter: "પ્રિન્ટર જોડો",
    errorFetch: "ડેશબોર્ડ ડેટા લોડ થઈ શક્યો નથી",
  },

  mr: {
    createBill: "बिल तयार करा",
    testPrinter: "प्रिंटर जोडा",
    errorFetch: "डॅशबोर्ड डेटा लोड होऊ शकला नाही",
  },

  te: {
    createBill: "బిల్ చేయండి",
    testPrinter: "ప్రింటర్ కనెక్ట్ చేయండి",
    errorFetch: "డ్యాష్‌బోర్డ్ డేటా లోడ్ కాలేదు",
  },
};


export const LANGUAGE_TEXT_ADD_CUSTOMER: any = {
  en: {
    addTitle: (isSup: boolean) => `Add New ${isSup ? "Supplier" : "Customer"}`,
    subtitle: "Enter basic account details",
    namePlace: "Name",
    mobilePlace: "Mobile number (optional)",
    balancePlace: "Opening balance (optional)",
    balanceType: "Balance type",
    youGave: "You gave (customer owes you)",
    youGot: "You got (advance)",
    nameReq: "Name is required",
    nameReqDetail: (isSup: boolean) =>
      `Please enter ${isSup ? "supplier" : "customer"} name`,
    success: "Done",
    successDetail: (name: string) => `${name} added successfully`,
    error: "Error",
    errorDetail: "Something went wrong. Please try again.",
    cta: (isSup: boolean) => `Add ${isSup ? "Supplier" : "Customer"}`,
    loading: "Adding account...",
  },

  hi: {
    addTitle: (isSup: boolean) => `नया ${isSup ? "सप्लायर" : "ग्राहक"} जोड़ें`,
    subtitle: "खाते की सामान्य जानकारी भरें",
    namePlace: "नाम",
    mobilePlace: "मोबाइल नंबर (जरूरी नहीं)",
    balancePlace: "शुरुआती रकम (जरूरी नहीं)",
    balanceType: "रकम का प्रकार",
    youGave: "आपने दिया (पैसे लेने हैं)",
    youGot: "आपको मिला (एडवांस)",
    nameReq: "नाम जरूरी है",
    nameReqDetail: (isSup: boolean) =>
      `${isSup ? "सप्लायर" : "ग्राहक"} का नाम डालें`,
    success: "हो गया",
    successDetail: (name: string) => `${name} सफलतापूर्वक जोड़ दिया गया`,
    error: "समस्या",
    errorDetail: "कुछ गलत हो गया। फिर से कोशिश करें।",
    cta: (isSup: boolean) => `${isSup ? "सप्लायर" : "ग्राहक"} जोड़ें`,
    loading: "खाता जोड़ा जा रहा है...",
  },

  pa: {
    addTitle: (isSup: boolean) => `ਨਵਾਂ ${isSup ? "ਸਪਲਾਇਰ" : "ਗਾਹਕ"} ਜੋੜੋ`,
    subtitle: "ਖਾਤੇ ਦੀ ਆਮ ਜਾਣਕਾਰੀ ਭਰੋ",
    namePlace: "ਨਾਂ",
    mobilePlace: "ਮੋਬਾਈਲ ਨੰਬਰ (ਚੋਣਵਾਂ)",
    balancePlace: "ਸ਼ੁਰੂਆਤੀ ਰਕਮ (ਚੋਣਵਾਂ)",
    balanceType: "ਰਕਮ ਦੀ ਕਿਸਮ",
    youGave: "ਤੁਸੀਂ ਦਿੱਤਾ (ਪੈਸੇ ਲੈਣੇ ਹਨ)",
    youGot: "ਤੁਹਾਨੂੰ ਮਿਲਿਆ (ਐਡਵਾਂਸ)",
    nameReq: "ਨਾਂ ਲਾਜ਼ਮੀ ਹੈ",
    nameReqDetail: (isSup: boolean) =>
      `${isSup ? "ਸਪਲਾਇਰ" : "ਗਾਹਕ"} ਦਾ ਨਾਂ ਭਰੋ`,
    success: "ਹੋ ਗਿਆ",
    successDetail: (name: string) => `${name} ਸਫਲਤਾਪੂਰਵਕ ਜੋੜਿਆ ਗਿਆ`,
    error: "ਗਲਤੀ",
    errorDetail: "ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    cta: (isSup: boolean) => `${isSup ? "ਸਪਲਾਇਰ" : "ਗਾਹਕ"} ਜੋੜੋ`,
    loading: "ਖਾਤਾ ਜੋੜਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
  },

  gu: {
    addTitle: (isSup: boolean) => `નવો ${isSup ? "સપ્લાયર" : "ગ્રાહક"} ઉમેરો`,
    subtitle: "ખાતાની સામાન્ય માહિતી ભરો",
    namePlace: "નામ",
    mobilePlace: "મોબાઇલ નંબર (વૈકલ્પિક)",
    balancePlace: "શરૂઆતની રકમ (વૈકલ્પિક)",
    balanceType: "રકમનો પ્રકાર",
    youGave: "તમે આપ્યા (પૈસા લેવા છે)",
    youGot: "તમને મળ્યા (એડવાન્સ)",
    nameReq: "નામ જરૂરી છે",
    nameReqDetail: (isSup: boolean) =>
      `${isSup ? "સપ્લાયર" : "ગ્રાહક"}નું નામ નાખો`,
    success: "થઈ ગયું",
    successDetail: (name: string) => `${name} સફળતાપૂર્વક ઉમેરાયો`,
    error: "ભૂલ",
    errorDetail: "કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.",
    cta: (isSup: boolean) => `${isSup ? "સપ્લાયર" : "ગ્રાહક"} ઉમેરો`,
    loading: "ખાતું ઉમેરાઈ રહ્યું છે...",
  },

  mr: {
    addTitle: (isSup: boolean) => `नवीन ${isSup ? "सप्लायर" : "ग्राहक"} जोडा`,
    subtitle: "खात्याची साधी माहिती भरा",
    namePlace: "नाव",
    mobilePlace: "मोबाइल नंबर (ऐच्छिक)",
    balancePlace: "सुरुवातीची रक्कम (ऐच्छिक)",
    balanceType: "रकमेचा प्रकार",
    youGave: "तुम्ही दिले (पैसे घ्यायचे आहेत)",
    youGot: "तुम्हाला मिळाले (अॅडव्हान्स)",
    nameReq: "नाव आवश्यक आहे",
    nameReqDetail: (isSup: boolean) =>
      `${isSup ? "सप्लायर" : "ग्राहक"}चे नाव टाका`,
    success: "झाले",
    successDetail: (name: string) => `${name} यशस्वीपणे जोडले गेले`,
    error: "चूक",
    errorDetail: "काहीतरी चुकले. पुन्हा प्रयत्न करा.",
    cta: (isSup: boolean) => `${isSup ? "सप्लायर" : "ग्राहक"} जोडा`,
    loading: "खाते जोडले जात आहे...",
  },

  te: {
    addTitle: (isSup: boolean) => `కొత్త ${isSup ? "సప్లయర్" : "కస్టమర్"}ను జోడించండి`,
    subtitle: "ఖాతా వివరాలు నమోదు చేయండి",
    namePlace: "పేరు",
    mobilePlace: "మొబైల్ నంబర్ (ఐచ్చికం)",
    balancePlace: "ప్రారంభ బాకీ (ఐచ్చికం)",
    balanceType: "బాకీ రకం",
    youGave: "మీరు ఇచ్చారు (డబ్బు రావాలి)",
    youGot: "మీకు వచ్చింది (అడ్వాన్స్)",
    nameReq: "పేరు అవసరం",
    nameReqDetail: (isSup: boolean) =>
      `${isSup ? "సప్లయర్" : "కస్టమర్"} పేరు నమోదు చేయండి`,
    success: "పూర్తయ్యింది",
    successDetail: (name: string) => `${name} విజయవంతంగా జోడించబడింది`,
    error: "లోపం",
    errorDetail: "ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి.",
    cta: (isSup: boolean) => `${isSup ? "సప్లయర్" : "కస్టమర్"}ను జోడించండి`,
    loading: "ఖాతా జోడించబడుతోంది...",
  },
};


export const LANGUAGE_TEXT_LEDGER_MODAL: any = {
  en: {
    addCredit: "Add Credit (You Got)",
    addDebit: "Add Debit (You Gave)",
    amount: "Amount",
    note: "Note (optional)",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
  },
  hi: {
    addCredit: "पैसे मिले (Credit)",
    addDebit: "पैसे दिए (Debit)",
    amount: "पैसे / राशि",
    note: "नोट (वैकल्पिक)",
    save: "सुरक्षित करें",
    saving: "सेव हो रहा है...",
    cancel: "रद्द करें",
  },
  pa: {
    addCredit: "ਪੈਸੇ ਮਿਲੇ (Credit)",
    addDebit: "ਪੈਸੇ ਦਿੱਤੇ (Debit)",
    amount: "ਰਕਮ",
    note: "ਨੋਟ (ਵੈਕਲਪਿਕ)",
    save: "ਸੇਵ ਕਰੋ",
    saving: "ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...",
    cancel: "ਰੱਦ ਕਰੋ",
  },
  gu: {
    addCredit: "પૈસા મળ્યા (Credit)",
    addDebit: "પૈસા આપ્યા (Debit)",
    amount: "રકમ",
    note: "નોંધ (વૈકલ્પિક)",
    save: "સાચવો",
    saving: "સેવ થઈ રહ્યું છે...",
    cancel: "રદ કરો",
  },
  mr: {
    addCredit: "पैसे मिळाले (Credit)",
    addDebit: "पैसे दिले (Debit)",
    amount: "रक्कम",
    note: "टीप (पर्यायी)",
    save: "जतन करा",
    saving: "सेव्ह होत आहे...",
    cancel: "रद्द करा",
  },
  te: {
    addCredit: "డబ్బులు వచ్చాయి (Credit)",
    addDebit: "డబ్బులు ఇచ్చాను (Debit)",
    amount: "మొత్తం",
    note: "గమనిక (ఐచ్ఛికం)",
    save: "సేవ్ చేయండి",
    saving: "సేవ్ అవుతోంది...",
    cancel: "రద్దు చేయండి",
  },
};

export const LANGUAGE_TEXT_DEBTOR_ROW: any = {
  en: {
    viewLedger: "View full ledger",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `Dear ${name},\n\nThis is a gentle reminder from *${shopName}* that an amount of ₹${amount} is currently pending in your account.\n\nWe request you to kindly clear the balance at your convenience. Please feel free to contact us if you have any questions.\n\nThank you for your continued support.\n\nWarm regards,\n${shopName}\n Powered by Store Saathi`,
  },

  hi: {
    viewLedger: "पूरा खाता देखें",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `प्रिय ${name},\n\n*${shopName}* की ओर से यह एक विनम्र स्मरण है कि आपके खाते में ₹${amount} की राशि बकाया है।\n\nकृपया सुविधा अनुसार भुगतान करने की कृपा करें। किसी भी जानकारी के लिए आप हमसे संपर्क कर सकते हैं।\n\nआपके सहयोग के लिए धन्यवाद।\n\nसादर,\n${shopName}\n Powered by Store Saathi`,
  },

  pa: {
    viewLedger: "ਪੂਰਾ ਖਾਤਾ ਵੇਖੋ",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `ਸਤਿਕਾਰਯੋਗ ${name},\n\n*${shopName}* ਵੱਲੋਂ ਇਹ ਇੱਕ ਨਮ੍ਰ ਯਾਦ ਦਿਵਾਉਣਾ ਹੈ ਕਿ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ₹${amount} ਦੀ ਰਕਮ ਬਕਾਇਆ ਹੈ।\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸੁਵਿਧਾ ਅਨੁਸਾਰ ਭੁਗਤਾਨ ਕਰਨ ਦੀ ਮਿਹਰਬਾਨੀ ਕਰੋ। ਕਿਸੇ ਵੀ ਸਵਾਲ ਲਈ ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।\n\nਤੁਹਾਡੇ ਸਹਿਯੋਗ ਲਈ ਧੰਨਵਾਦ।\n\nਸਾਦਰ,\n${shopName}\n Powered by Store Saathi`,
  },

  gu: {
    viewLedger: "આખું ખાતું જુઓ",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `માનનીય ${name},\n\n*${shopName}* તરફથી આ એક વિનમ્ર યાદ અપાવવું છે કે તમારા ખાતામાં ₹${amount} ની રકમ બાકી છે.\n\nકૃપા કરીને તમારી સુવિધા મુજબ ચુકવણી કરવા વિનંતી. કોઈપણ પ્રશ્ન માટે અમારો સંપર્ક કરો.\n\nતમારા સહયોગ માટે આભાર.\n\nસાદર,\n${shopName}\n Powered by Store Saathi`,
  },

  mr: {
    viewLedger: "पूर्ण खाते पहा",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `आदरणीय ${name},\n\n*${shopName}* कडून ही एक नम्र आठवण आहे की आपल्या खात्यावर ₹${amount} इतकी रक्कम थकित आहे.\n\nकृपया आपल्या सोयीप्रमाणे भरणा करण्याची विनंती. काही शंका असल्यास आमच्याशी संपर्क साधा.\n\nआपल्या सहकार्याबद्दल धन्यवाद.\n\nआपला विश्वासू,\n${shopName}\n Powered by Store Saathi`,
  },

  te: {
    viewLedger: "పూర్తి లెడ్జర్ చూడండి",
    whatsappMsg: (name: string, amount: string, shopName: string) =>
      `గౌరవనీయులైన ${name},\n\n*${shopName}* నుండి ఇది ఒక వినయపూర్వక గుర్తు. మీ ఖాతాలో ₹${amount} మొత్తము ఇంకా బాకీగా ఉంది.\n\nదయచేసి మీ సౌకర్యానుసారం చెల్లించగలరు. ఏవైనా సందేహాలు ఉంటే మమ్మల్ని సంప్రదించండి.\n\nమీ సహకారానికి ధన్యవాదాలు.\n\nఆదరాభిమానాలతో,\n${shopName}\n Powered by Store Saathi`,
  },
};


export const LANGUAGE_TEXT_LEDGER_CHAT: any = {
  en: {
    youGot: "YOU GOT",
    youGave: "YOU GAVE",
    viewBill: "View Full Bill",
  },
  hi: {
    youGot: "बकाया मिला", // You Got
    youGave: "उधार दिया", // You Gave
    viewBill: "पूरा बिल देखें",
  },
  pa: {
    youGot: "ਪੈਸੇ ਮਿਲੇ",
    youGave: "ਉਧਾਰ ਦਿੱਤਾ",
    viewBill: "ਪੂਰਾ ਬਿੱਲ ਵੇਖੋ",
  },
  gu: {
    youGot: "પૈસા મળ્યા",
    youGave: "ઉધાર આપ્યા",
    viewBill: "આખું બિલ જુઓ",
  },
  mr: {
    youGot: "पैसे मिळाले",
    youGave: "उधार दिले",
    viewBill: "पूर्ण बिल पहा",
  },
  te: {
    youGot: "డబ్బులు వచ్చాయి",
    youGave: "అప్పు ఇచ్చాను",
    viewBill: "పూర్తి బిల్లు చూడండి",
  },
};


export const LANGUAGE_TEXT_LEDGER_HEADER: any = {
  en: {
    due: "Due",
    advance: "Advance",
    settled: "Settled",
    editCustomer: "Edit Profile",
    deleteCustomer: "Delete Customer",
  },
  hi: {
    due: "बकाया",
    advance: "एडवांस",
    settled: "हिसाब बराबर",
    editCustomer: "प्रोफाइल बदलें",
    deleteCustomer: "ग्राहक हटाएं",
  },
  pa: {
    due: "ਬਾਕੀ",
    advance: "ਐਡਵਾਂਸ",
    settled: "ਹਿਸਾਬ ਬਰਾਬਰ",
    editCustomer: "ਪ੍ਰੋਫਾਈਲ ਬਦਲੋ",
    deleteCustomer: "ਗ੍ਰਾਹਕ ਹਟਾਓ",
  },
  gu: {
    due: "બાકી",
    advance: "એડવાન્સ",
    settled: "હિસાબ બરાબર",
    editCustomer: "પ્રોફાઇલ સંપાદિત કરો",
    deleteCustomer: "ગ્રાહક કાઢી નાખો",
  },
  mr: {
    due: "बाकी",
    advance: "अ‍ॅडव्हान्स",
    settled: "हिशोब पूर्ण",
    editCustomer: "प्रोफाइल संपादित करा",
    deleteCustomer: "ग्राहक हटवा",
  },
  te: {
    due: "బాకీ ఉంది",
    advance: "అడ్వాన్స్",
    settled: "సెటిల్ అయ్యింది",
    editCustomer: "ప్రొఫైల్‌ను సవరించండి",
    deleteCustomer: "కస్టమర్‌ను తొలగించండి",
  },
};


export const LANGUAGE_TEXT_LEDGER_INPUT: any = {
  en: {
    newEntry: "New Entry",
    title: "New Transaction",
    subtitle: "Enter details below",
    paymentReceived: "Payment Received",
    amountDue: "Amount Due",
    notePlace: "Add a note (e.g. For Groceries)",
    confirm: "Confirm Entry",
    processing: "Processing...",
  },
  hi: {
    newEntry: "नई एंट्री",
    title: "नया लेन-देन",
    subtitle: "विवरण दर्ज करें",
    paymentReceived: "पैसे मिले",
    amountDue: "उधार दिया",
    notePlace: "नोट लिखें (जैसे: राशन के लिए)",
    confirm: "एंट्री पक्की करें",
    processing: "प्रोसेस हो रहा है...",
  },
  pa: {
    newEntry: "ਨਵੀਂ ਐਂਟਰੀ",
    title: "ਨਵਾਂ ਲੈਣ-ਦੇਣ",
    subtitle: "ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
    paymentReceived: "ਪੈਸੇ ਮਿਲੇ",
    amountDue: "ਉਧਾਰ ਦਿੱਤਾ",
    notePlace: "ਨੋਟ ਲਿਖੋ (ਜਿਵੇਂ: ਰਾਸ਼ਨ ਲਈ)",
    confirm: "ਐਂਟਰੀ ਪੱਕੀ ਕਰੋ",
    processing: "ਪ੍ਰੋਸੈਸ ਹੋ ਰਿਹਾ ਹੈ...",
  },
  gu: {
    newEntry: "નવી એન્ટ્રી",
    title: "નવો વ્યવહાર",
    subtitle: "વિગતો દાખલ કરો",
    paymentReceived: "પૈસા મળ્યા",
    amountDue: "ઉધાર આપ્યા",
    notePlace: "નોંધ લખો (દા.ત. કરિયાણા માટે)",
    confirm: "એન્ટ્રી કન્ફર્મ કરો",
    processing: "પ્રોસેસ થઈ રહ્યું છે...",
  },
  mr: {
    newEntry: "नवीन एन्ट्री",
    title: "नवीन व्यवहार",
    subtitle: "तपशील प्रविष्ट करा",
    paymentReceived: "पैसे मिळाले",
    amountDue: "उधार दिले",
    notePlace: "टीप लिहा (उदा. किराणा सामानासाठी)",
    confirm: "एन्ट्री नक्की करा",
    processing: "प्रक्रिया होत आहे...",
  },
  te: {
    newEntry: "కొత్త ఎంట్రీ",
    title: "కొత్త లావాదేవీ",
    subtitle: "వివరాలను నమోదు చేయండి",
    paymentReceived: "డబ్బులు వచ్చాయి",
    amountDue: "అప్పు ఇచ్చాను",
    notePlace: "గమనిక రాయండి (ఉదా: కిరాణా కోసం)",
    confirm: "ఎంట్రీని ఖరారు చేయండి",
    processing: "ప్రాసెస్ అవుతోంది...",
  },
};

export const LANGUAGE_TEXT_LEDGER_SUMMARY: any = {
  en: {
    youGet: "You will get",
    youGive: "You will give",
  },
  hi: {
    youGet: "आपको लेना है",
    youGive: "आपको देना है",
  },
  pa: {
    youGet: "ਤੁਸੀਂ ਲੈਣਾ ਹੈ",
    youGive: "ਤੁਸੀਂ ਦੇਣਾ ਹੈ",
  },
  gu: {
    youGet: "તમારે લેવાના છે",
    youGive: "તમારે આપવાના છે",
  },
  mr: {
    youGet: "तुम्हाला येणे आहे",
    youGive: "तुम्हाला देणे आहे",
  },
  te: {
    youGet: "మీకు రావాలి",
    youGive: "మీరు ఇవ్వాలి",
  },
};

export const LANGUAGE_TEXT_LEDGER_MAIN_HEADER: any = {
  en: {
    ledgerTitle: "Ledger",
    tagline: "Never lose your dues",
  },
  hi: {
    ledgerTitle: "बही खाता",
    tagline: "उधारी का हिसाब, अब बिल्कुल साफ",
  },
  pa: {
    ledgerTitle: "ਬਹੀ ਖਾਤਾ",
    tagline: "ਉਧਾਰੀ ਦਾ ਹਿਸਾਬ, ਹੁਣ ਬਿਲਕੁਲ ਸਾਫ਼",
  },
  gu: {
    ledgerTitle: "વહી ખાતું",
    tagline: "ઉધારનો હિસાબ, હવે બિલકુલ સાફ",
  },
  mr: {
    ledgerTitle: "बही खाते",
    tagline: "उधारीचा हिशोब, आता पूर्णपणे स्पष्ट",
  },
  te: {
    ledgerTitle: "లెడ్జర్",
    tagline: "మీ బాకీల లెక్క, ఇకపై పక్కా",
  },
};

export const LANGUAGE_TEXT_LEDGER_LIST: any = {
  en: {
    customers: "Customers",
    suppliers: "Suppliers",
    searchPlaceholder: "Search by name or mobile number...",
    mostDue: "Highest due",
    mostAdvance: "Highest advance",
    addBtn: (isSup: boolean) => `Add ${isSup ? "Supplier" : "Customer"}`,
  },

  hi: {
    customers: "ग्राहक",
    suppliers: "सप्लायर",
    searchPlaceholder: "नाम या मोबाइल नंबर से खोजें...",
    mostDue: "सबसे ज्यादा बकाया",
    mostAdvance: "सबसे ज्यादा एडवांस",
    addBtn: (isSup: boolean) => `${isSup ? "सप्लायर" : "ग्राहक"} जोड़ें`,
  },

  pa: {
    customers: "ਗਾਹਕ",
    suppliers: "ਸਪਲਾਇਰ",
    searchPlaceholder: "ਨਾਂ ਜਾਂ ਮੋਬਾਈਲ ਨੰਬਰ ਨਾਲ ਖੋਜੋ...",
    mostDue: "ਸਭ ਤੋਂ ਵੱਧ ਬਕਾਇਆ",
    mostAdvance: "ਸਭ ਤੋਂ ਵੱਧ ਐਡਵਾਂਸ",
    addBtn: (isSup: boolean) => `${isSup ? "ਸਪਲਾਇਰ" : "ਗਾਹਕ"} ਜੋੜੋ`,
  },

  gu: {
    customers: "ગ્રાહકો",
    suppliers: "સપ્લાયર",
    searchPlaceholder: "નામ અથવા મોબાઇલ નંબરથી શોધો...",
    mostDue: "વધારે બાકી",
    mostAdvance: "વધારે એડવાન્સ",
    addBtn: (isSup: boolean) => `${isSup ? "સપ્લાયર" : "ગ્રાહક"} ઉમેરો`,
  },

  mr: {
    customers: "ग्राहक",
    suppliers: "सप्लायर",
    searchPlaceholder: "नाव किंवा मोबाईल नंबरने शोधा...",
    mostDue: "सर्वात जास्त बाकी",
    mostAdvance: "सर्वात जास्त अ‍ॅडव्हान्स",
    addBtn: (isSup: boolean) => `${isSup ? "सप्लायर" : "ग्राहक"} जोडा`,
  },

  te: {
    customers: "కస్టమర్లు",
    suppliers: "సప్లయర్లు",
    searchPlaceholder: "పేరు లేదా మొబైల్ నంబర్‌తో వెతకండి...",
    mostDue: "ఎక్కువ బాకీ",
    mostAdvance: "ఎక్కువ అడ్వాన్స్",
    addBtn: (isSup: boolean) =>
      `${isSup ? "సప్లయర్" : "కస్టమర్"}ను జోడించండి`,
  },
};

export const LANGUAGE_TEXT_LEDGER_DETAIL: any = {
  en: {
    noTransactions: "No transactions found for this customer",
    today: "Today",
    yesterday: "Yesterday",
  },
  hi: {
    noTransactions: "इस ग्राहक के लिए कोई लेनदेन नहीं मिला",
    today: "आज",
    yesterday: "कल",
  },
  pa: {
    noTransactions: "ਇਸ ਗਾਹਕ ਲਈ ਕੋਈ ਲੈਣ-ਦੇਣ ਨਹੀਂ ਮਿਲਿਆ",
    today: "ਅੱਜ",
    yesterday: "ਕੱਲ੍ਹ",
  },
  gu: {
    noTransactions: "આ ગ્રાહક માટે કોઈ વ્યવહાર મળ્યા નથી",
    today: "આજે",
    yesterday: "ગઈકાલે",
  },
  mr: {
    noTransactions: "या ग्राहकासाठी कोणतेही व्यवहार आढळले नाहीत",
    today: "आज",
    yesterday: "काल",
  },
  te: {
    noTransactions: "ఈ కస్టమర్ కోసం ఎటువంటి లావాదేవీలు కనుగొనబడలేదు",
    today: "ఈరోజు",
    yesterday: "నిన్న",
  },
};

export const LANGUAGE_TEXT_ANALYTICS: any = {
  en: {
    title: "Analytics",
    today: "Today",
    yesterday: "Yesterday",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    totalSales: "TOTAL SALES",
    collected: "Collected",
    pendingDebt: "Pending Debt",
    biggestBill: "BIGGEST BILL",
    seeBillDetails: "See Bill Details",
    productsSold: (count: number) => `PRODUCTS SOLD (${count})`,
    noProducts: "No products sold in this period",
    showTop5: "Show Top 5 Only",
    seeMore: (count: number) => `See More (${count} more)`,
    retry: "Retry",
    error: "Error",
    selectDate: "Select Date",
  },
  hi: {
    title: "रिपोर्ट्स",
    today: "आज",
    yesterday: "कल",
    daily: "दैनिक",
    weekly: "साप्ताहिक",
    monthly: "मासिक",
    yearly: "वार्षिक",
    totalSales: "कुल बिक्री",
    collected: "वसूली हुई",
    pendingDebt: "बाकी उधारी",
    biggestBill: "सबसे बड़ा बिल",
    seeBillDetails: "बिल की जानकारी",
    productsSold: (count: number) => `बिके हुए सामान (${count})`,
    noProducts: "इस अवधि में कोई सामान नहीं बिका",
    showTop5: "सिर्फ टॉप 5 देखें",
    seeMore: (count: number) => `और देखें (${count} और)`,
    retry: "फिर कोशिश करें",
    error: "त्रुटि",
    selectDate: "तारीख चुनें",
  },
  pa: {
    title: "ਰਿਪੋਰਟਸ",
    today: "ਅੱਜ",
    yesterday: "ਕੱਲ੍ਹ",
    daily: "ਰੋਜ਼ਾਨਾ",
    weekly: "ਹਫਤਾਵਾਰੀ",
    monthly: "ਮਾਸਿਕ",
    yearly: "ਸਾਲਾਨਾ",
    totalSales: "ਕੁੱਲ ਵਿਕਰੀ",
    collected: "ਵਸੂਲੀ",
    pendingDebt: "ਬਾਕੀ ਉਧਾਰ",
    biggestBill: "ਸਭ ਤੋਂ ਵੱਡਾ ਬਿੱਲ",
    seeBillDetails: "ਬਿੱਲ ਦੀ ਜਾਣਕਾਰੀ",
    productsSold: (count: number) => `ਵਿਕੇ ਹੋਏ ਸਮਾਨ (${count})`,
    noProducts: "ਇਸ ਸਮੇਂ ਵਿੱਚ ਕੋਈ ਸਮਾਨ ਨਹੀਂ ਵਿਕਿਆ",
    showTop5: "ਸਿਰਫ ਟਾਪ 5 ਦੇਖੋ",
    seeMore: (count: number) => `ਹੋਰ ਦੇਖੋ (${count} ਹੋਰ)`,
    retry: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    error: "ਗਲਤੀ",
    selectDate: "ਤਾਰੀਖ ਚੁਣੋ",
  },
  gu: {
    title: "રિપોર્ટ્સ",
    today: "આજે",
    yesterday: "ગઈકાલે",
    daily: "દૈનિક",
    weekly: "સાપ્તાહિક",
    monthly: "માસિક",
    yearly: "વાર્ષિક",
    totalSales: "કુલ વેચાણ",
    collected: "વસૂલાત",
    pendingDebt: "બાકી દેવું",
    biggestBill: "સૌથી મોટું બિલ",
    seeBillDetails: "બિલની વિગતો",
    productsSold: (count: number) => `વેચાયેલી વસ્તુઓ (${count})`,
    noProducts: "આ સમયગાળામાં કોઈ વસ્તુ વેચાઈ નથી",
    showTop5: "ફક્ત ટોચના 5 જુઓ",
    seeMore: (count: number) => `વધારે જુઓ (${count} વધુ)`,
    retry: "ફરી પ્રયાસ કરો",
    error: "ભૂલ",
    selectDate: "તારીખ પસંદ કરો",
  },
  mr: {
    title: "रिपोर्ट्स",
    today: "आज",
    yesterday: "काल",
    daily: "दैनिक",
    weekly: "साप्ताहिक",
    monthly: "मासिक",
    yearly: "वार्षिक",
    totalSales: "एकूण विक्री",
    collected: "वसूल केलेले",
    pendingDebt: "बाकी उधारी",
    biggestBill: "सर्वात मोठे बिल",
    seeBillDetails: "बिलाचा तपशील",
    productsSold: (count: number) => `विकलेली उत्पादने (${count})`,
    noProducts: "या कालावधीत कोणतीही उत्पादने विकली गेली नाहीत",
    showTop5: "फक्त टॉप 5 पहा",
    seeMore: (count: number) => `आणखी पहा (${count} अधिक)`,
    retry: "पुन्हा प्रयत्न करा",
    error: "त्रुटी",
    selectDate: "तारीख निवडा",
  },
  te: {
    title: "విశ్లేషణ",
    today: "ఈరోజు",
    yesterday: "నిన్న",
    daily: "రోజువారీ",
    weekly: "వారపు",
    monthly: "నెలవారీ",
    yearly: "వార్షిక",
    totalSales: "మొత్తం అమ్మకాలు",
    collected: "వసూలు చేసినవి",
    pendingDebt: "పెండింగ్ అప్పు",
    biggestBill: "అతిపెద్ద బిల్లు",
    seeBillDetails: "బిల్లు వివరాలు",
    productsSold: (count: number) => `అమ్మిన వస్తువులు (${count})`,
    noProducts: "ఈ కాలంలో అమ్మకాలు లేవు",
    showTop5: "టాప్ 5 మాత్రమే",
    seeMore: (count: number) => `మరిన్ని చూడండి (${count} మరిన్ని)`,
    retry: "మళ్ళీ ప్రయత్నించండి",
    error: "లోపం",
    selectDate: "తేదీని ఎంచుకోండి",
  }
};