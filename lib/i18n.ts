export interface Translations {
  [key: string]: string
}

export interface TranslationSet {
  [key: string]: Translations
}

export const translations: TranslationSet = {
  en: {
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.retry": "Retry",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.offline": "Offline",
    "common.online": "Online",

    // Auth
    "auth.welcome": "Welcome to traceya",
    "auth.farmerId": "Farmer ID",
    "auth.otp": "OTP",
    "auth.sendOtp": "Send OTP",
    "auth.signIn": "Sign In",
    "auth.logout": "Logout",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.captureNew": "Capture New Collection",
    "dashboard.recentCollections": "Recent Collections",
    "dashboard.noCollections": "No collections yet",
    "dashboard.createFirst": "Create Your First Collection",

    // Capture
    "capture.title": "Capture Collection",
    "capture.species": "Species",
    "capture.moisture": "Moisture Percentage",
    "capture.notes": "Notes",
    "capture.location": "Location",
    "capture.photos": "Photos",
    "capture.saveOffline": "Save Offline",
    "capture.syncNow": "Sync Now",
    "capture.sendSms": "Send via SMS",

    // Settings
    "settings.title": "Settings",
    "settings.syncInterval": "Sync Interval",
    "settings.smsGateway": "SMS Gateway Number",
    "settings.language": "Language",
    "settings.clearData": "Clear All Data",
    "settings.exportData": "Export Data",

    // Status
    "status.synced": "Synced",
    "status.pending": "Pending",
    "status.uploading": "Uploading",
    "status.failed": "Failed",
  },
  hi: {
    // Common
    "common.save": "सेव करें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.retry": "पुनः प्रयास",
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफलता",
    "common.offline": "ऑफलाइन",
    "common.online": "ऑनलाइन",

    // Auth
    "auth.welcome": "traceya में आपका स्वागत है",
    "auth.farmerId": "किसान आईडी",
    "auth.otp": "ओटीपी",
    "auth.sendOtp": "ओटीपी भेजें",
    "auth.signIn": "साइन इन",
    "auth.logout": "लॉगआउट",

    // Dashboard
    "dashboard.title": "डैशबोर्ड",
    "dashboard.welcome": "वापसी पर स्वागत",
    "dashboard.captureNew": "नया संग्रह कैप्चर करें",
    "dashboard.recentCollections": "हाल के संग्रह",
    "dashboard.noCollections": "अभी तक कोई संग्रह नहीं",
    "dashboard.createFirst": "अपना पहला संग्रह बनाएं",

    // Capture
    "capture.title": "संग्रह कैप्चर करें",
    "capture.species": "प्रजाति",
    "capture.moisture": "नमी प्रतिशत",
    "capture.notes": "टिप्पणियां",
    "capture.location": "स्थान",
    "capture.photos": "फोटो",
    "capture.saveOffline": "ऑफलाइन सेव करें",
    "capture.syncNow": "अभी सिंक करें",
    "capture.sendSms": "SMS के द्वारा भेजें",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.syncInterval": "सिंक अंतराल",
    "settings.smsGateway": "SMS गेटवे नंबर",
    "settings.language": "भाषा",
    "settings.clearData": "सभी डेटा साफ़ करें",
    "settings.exportData": "डेटा निर्यात करें",

    // Status
    "status.synced": "सिंक हो गया",
    "status.pending": "लंबित",
    "status.uploading": "अपलोड हो रहा",
    "status.failed": "असफल",
  },
}

export class I18nManager {
  private static instance: I18nManager
  private currentLanguage: "en" | "hi" = "en"

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager()
    }
    return I18nManager.instance
  }

  constructor() {
    this.loadLanguage()
  }

  private loadLanguage(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("traceya_language")
      if (stored && (stored === "en" || stored === "hi")) {
        this.currentLanguage = stored
      }
    }
  }

  setLanguage(language: "en" | "hi"): void {
    this.currentLanguage = language
    if (typeof window !== "undefined") {
      localStorage.setItem("traceya_language", language)
    }
  }

  getLanguage(): "en" | "hi" {
    return this.currentLanguage
  }

  t(key: string): string {
    const translation = translations[this.currentLanguage][key]
    return translation || key
  }
}

export const i18n = I18nManager.getInstance()
