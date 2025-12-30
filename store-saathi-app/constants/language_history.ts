export const LANGUAGE_TEXT_BILLS_HISTORY: any = {
  en: {
    history: "History",
    today: "Today",
    yesterday: "Yesterday",
    billNo: (num: string) => `Bill #${num}`,
    noBills: "No bills found",
    clearFilterSub: "Try picking a different date or clear the filter.",
    defaultEmptySub: "Your billed transactions will appear here.",
    loadMore: "LOAD PREVIOUS BILLS",
    status: {
      PAID: "PAID",
      PARTIAL: "PARTIAL",
      UNPAID: "UNPAID"
    }
  },
  hi: {
    history: "लेन-देन का इतिहास",
    today: "आज",
    yesterday: "कल",
    billNo: (num: string) => `बिल #${num}`,
    noBills: "कोई बिल नहीं मिला",
    clearFilterSub: "कोई और तारीख चुनें या फिल्टर हटाएं।",
    defaultEmptySub: "आपके सभी बिल यहाँ दिखाई देंगे।",
    loadMore: "पुराने बिल देखें",
    status: {
      PAID: "चुकता",
      PARTIAL: "बाकी",
      UNPAID: "उधार"
    }
  },
  pa: {
    history: "ਬਿੱਲਾਂ ਦਾ ਇਤਿਹਾਸ",
    today: "ਅੱਜ",
    yesterday: "ਕੱਲ੍ਹ",
    billNo: (num: string) => `ਬਿੱਲ #${num}`,
    noBills: "ਕੋਈ ਬਿੱਲ ਨਹੀਂ ਮਿਲਿਆ",
    clearFilterSub: "ਕੋਈ ਹੋਰ ਤਾਰੀਖ ਚੁਣੋ ਜਾਂ ਫਿਲਟਰ ਹਟਾਓ।",
    defaultEmptySub: "ਤੁਹਾਡੇ ਸਾਰੇ ਬਿੱਲ ਇੱਥੇ ਦਿਖਾਈ ਦੇਣਗੇ।",
    loadMore: "ਪੁਰਾਣੇ ਬਿੱਲ ਦੇਖੋ",
    status: {
      PAID: "ਭੁਗਤਾਨ ਹੋ ਗਿਆ",
      PARTIAL: "ਅਧੂਰਾ",
      UNPAID: "ਬਾਕੀ"
    }
  },
  gu: {
    history: "બિલનો ઈતિહાસ",
    today: "આજે",
    yesterday: "ગઈકાલે",
    billNo: (num: string) => `બિલ #${num}`,
    noBills: "કોઈ બિલ મળ્યા નથી",
    clearFilterSub: "બીજી તારીખ પસંદ કરો અથવા ફિલ્ટર સાફ કરો.",
    defaultEmptySub: "તમારા બધા બિલ અહીં દેખાશે.",
    loadMore: "જૂના બિલ જુઓ",
    status: {
      PAID: "ચૂકવેલ",
      PARTIAL: "બાકી",
      UNPAID: "બાકી"
    }
  },
  mr: {
    history: "बिलांचा इतिहास",
    today: "आज",
    yesterday: "काल",
    billNo: (num: string) => `बिल #${num}`,
    noBills: "कोणतेही बिल आढळले नाही",
    clearFilterSub: "वेगळी तारीख निवडा किंवा फिल्टर साफ करा.",
    defaultEmptySub: "तुमचे सर्व व्यवहार येथे दिसतील.",
    loadMore: "जुने बिल पहा",
    status: {
      PAID: "पूर्ण भरले",
      PARTIAL: "अर्धवट",
      UNPAID: "थकीत"
    }
  },
  te: {
    history: "బిల్లుల చరిత్ర",
    today: "ఈరోజు",
    yesterday: "నిన్న",
    billNo: (num: string) => `బిల్లు #${num}`,
    noBills: "బిల్లులు ఏవీ లేవు",
    clearFilterSub: "వేరే తేదీని ఎంచుకోండి లేదా ఫిల్టర్‌ని తీసివేయండి.",
    defaultEmptySub: "మీ బిల్లుల వివరాలు ఇక్కడ కనిపిస్తాయి.",
    loadMore: "పాత బిల్లులను చూడండి",
    status: {
      PAID: "చెల్లించారు",
      PARTIAL: "పాక్షికం",
      UNPAID: "చెల్లించలేదు"
    }
  }
};