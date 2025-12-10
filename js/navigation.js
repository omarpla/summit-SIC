/**
 * NAVIGATION SYSTEM - SUMMIT INTERNATIONAL COMPANY
 * File: navigation.js
 * Version: 3.0.0
 * Description: Enhanced navigation with modern JavaScript
 * Dependencies: Uses CSS variables from global-styles.css
 */

// ============================================
// MODULE PATTERN FOR ENCAPSULATION
// ============================================
// في بداية الملف، بعد التعليقات
const NAV_CONFIG = {
  HISTORY_MAX: 10,
  STORAGE_KEYS: {
    LAST_SECTION: "summitLastValidSection",
    HISTORY: "summitNavigationHistory",
    LANGUAGE: "summitPreferredLang",
  },
  SCROLL_OFFSET: 100,
  DEBOUNCE_DELAYS: {
    SCROLL: 10,
    RESIZE: 100,
  },
};
const NavigationSystem = (function () {
  // ============================================
  // PRIVATE VARIABLES
  // ============================================

  let config = {
    isMobileMenuOpen: false,
    currentSection: "home",
    preferredLang: "ar",
    scrollDebounceTimer: null,
    resizeDebounceTimer: null,
  };

  let elements = {
    navbar: null,
    navbarContainer: null,
    mobileMenuBtn: null,
    mobileMenu: null,
    desktopMenu: null,
    navLinks: [],
    langToggles: [],
    navScrollIndicator: null,
    navCTAs: [],
    sections: [],
  };
  let navigationHistory = [];
  let lastValidSection = null;
  const NAV_HISTORY_MAX = 10; // أقصى عدد في السجل
  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
        try {

    // 1. Cache DOM elements
    cacheElements();
    // تحقق من وجود العناصر الأساسية
    if (!elements.navbar) {
      console.warn("عنصر navbar غير موجود");
    }
    // 2. Setup event listeners
    setupEventListeners();

    // 3. Initialize state
    initializeState();
    // 4. Dispatch ready event
    dispatchEvent("navigation:ready", {
      elements: elements,
      config: config,
      hasSections: elements.sections.length,
    });

        console.log(`✅ Navigation System Initialized - ${elements.sections.length} sections found`);
         } catch (error) {
        console.error('❌ Error initializing navigation system:', error);
        logNavigationError('init_failed', null, { error: error.message });
    }
  }

  // ============================================
  // ELEMENT CACHING
  // ============================================

  function cacheElements() {
    elements.navbar = document.getElementById("navbar");
    elements.navbarContainer = document.querySelector(".navbar-container");
    elements.mobileMenuBtn = document.getElementById("mobileMenuBtn");
    elements.mobileMenu = document.getElementById("mobileMenu");
    elements.desktopMenu = document.querySelector(".desktop-menu");
    elements.navLinks = document.querySelectorAll(".nav-link");
    elements.langToggles = document.querySelectorAll(".lang-btn");
    elements.navScrollIndicator = document.getElementById("navScrollIndicator");
    elements.navCTAs = document.querySelectorAll(".nav-cta, .mobile-cta");
    elements.sections = document.querySelectorAll("section[id]");
  }

  // دالة جديدة: تسجيل أخطاء التنقل
  function logNavigationError(errorType, sectionId, details = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: errorType,
      sectionId: sectionId,
      currentSection: config.currentSection,
      lastValidSection: lastValidSection,
      history: [...navigationHistory],
      details: details,
    };

    // حفظ في localStorage للتحليل
    const errorKey = "summitNavErrors";
    const existingErrors = JSON.parse(localStorage.getItem(errorKey) || "[]");
    existingErrors.push(errorLog);

    if (existingErrors.length > 50) {
      existingErrors.shift();
    }

    localStorage.setItem(errorKey, JSON.stringify(existingErrors));

    // إرسال حدث
    dispatchEvent("navigation:error", errorLog);

    return errorLog;
  }
  // ============================================
  // EVENT LISTENERS SETUP
  // ============================================

  function setupEventListeners() {
    // Mobile menu toggle
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.addEventListener("click", toggleMobileMenu);
    }

    // Navigation links
    elements.navLinks.forEach((link) => {
      link.addEventListener("click", handleNavLinkClick);
    });

    // Language toggles
    elements.langToggles.forEach((toggle) => {
      toggle.addEventListener("click", handleLanguageToggle);
    });

    // Navigation CTAs
    elements.navCTAs.forEach((cta) => {
      cta.addEventListener("click", handleCTAClick);
    });

    // Scroll events
    window.addEventListener("scroll", debounce(handleScroll, 10));

    // Resize events
    window.addEventListener("resize", debounce(handleResize, 100));

    // Keyboard events
    document.addEventListener("keydown", handleKeyboardNavigation);

    // Touch events for mobile
    if ("ontouchstart" in window) {
      setupTouchEvents();
    }
  }

  // ============================================
  // STATE INITIALIZATION
  // ============================================

  function initializeState() {
    // Load saved language preference
    loadLanguagePreference();

    // Set initial active section
    updateActiveSection();

    // تعيين آخر قسم صالح (جديد)
    setInitialValidSection();

    // استعادة السجل من التخزين المحلي (جديد)
    restoreNavigationHistory();

    // Set initial scroll state
    handleScroll();

    // Check if mobile
    checkMobileView();

    // حفظ آخر قسم صالح (جديد)
    saveLastValidSection();

    dispatchEvent("state:initialized", {
      lastValidSection: lastValidSection,
      navigationHistory: navigationHistory,
    });
  }
  // دالة جديدة: استعادة سجل التنقل
  function restoreNavigationHistory() {
    try {
      const savedHistory = localStorage.getItem(
        NAV_CONFIG.STORAGE_KEYS.HISTORY
      );
      if (savedHistory) {
        navigationHistory = JSON.parse(savedHistory);

        // تصفية العناصر غير الموجودة حالياً
        navigationHistory = navigationHistory.filter((sectionId) => {
          return document.getElementById(sectionId);
        });

        dispatchEvent("history:restored", {
          history: navigationHistory,
          count: navigationHistory.length,
        });
      }
    } catch (error) {
      console.error("تعذر استعادة سجل التنقل:", error);
      navigationHistory = [];
    }
  }

  // دالة جديدة: تعيين القسم الصالح الابتدائي
  function setInitialValidSection() {
    // الحصول على جميع الأقسام
    const allSections = document.querySelectorAll("section[id]");

    if (allSections.length === 0) {
      lastValidSection = null;
      return;
    }

    // محاولة الحصول على القسم الحالي من التخزين المحلي
    const savedSection = localStorage.getItem(
      NAV_CONFIG.STORAGE_KEYS.LAST_SECTION
    );
    if (savedSection) {
      const savedElement = document.getElementById(savedSection);
      if (savedElement) {
        lastValidSection = savedSection;
        return;
      }
    }
    // استخدام أول قسم كبديل
    lastValidSection = allSections[0].id;
  }

  // دالة جديدة: حفظ آخر قسم صالح
  function saveLastValidSection() {
    if (lastValidSection) {
      localStorage.setItem(
        NAV_CONFIG.STORAGE_KEYS.LAST_SECTION,
        lastValidSection
      );
    }
  }

  // ============================================
  // MOBILE MENU FUNCTIONS
  // ============================================

  function toggleMobileMenu(event) {
    if (event) event.stopPropagation();

    config.isMobileMenuOpen = !config.isMobileMenuOpen;

    // Toggle menu visibility
    if (elements.mobileMenu) {
      elements.mobileMenu.classList.toggle("active");
      elements.mobileMenu.setAttribute("aria-hidden", !config.isMobileMenuOpen);
    }

    // Toggle button state
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.classList.toggle("active");
      elements.mobileMenuBtn.setAttribute(
        "aria-expanded",
        config.isMobileMenuOpen
      );

      // Update button icon
      const icon = elements.mobileMenuBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
      }
    }

    // Toggle body scroll
    document.body.style.overflow = config.isMobileMenuOpen ? "hidden" : "";

    // Dispatch event
    dispatchEvent("mobileMenu:toggled", {
      isOpen: config.isMobileMenuOpen,
    });
  }

  function closeMobileMenu() {
    if (config.isMobileMenuOpen) {
      toggleMobileMenu();
    }
  }

  // ============================================
  // SCROLL FUNCTIONS
  // ============================================

  function handleScroll() {
    // Update navbar scroll state
    updateNavbarScrollState();

    // Update active section
    updateActiveSection();

    // Update scroll indicator
    updateScrollIndicator();
  }

  function updateNavbarScrollState() {
    if (!elements.navbar) return;

    const scrollY = window.scrollY;
    if (scrollY > 50) {
      elements.navbar.classList.add("scrolled");
    } else {
      elements.navbar.classList.remove("scrolled");
    }
  }

  function updateActiveSection() {
    let currentSection = "home";
    const scrollPosition = window.scrollY + NAV_CONFIG.SCROLL_OFFSET;

    elements.sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = section.getAttribute("id");
      }
    });

    if (config.currentSection !== currentSection) {
      // تحديث التاريخ عند التمرير الطبيعي
      // أضف تحقق إضافي لمنع التكرار
      if (
        currentSection !== "home" &&
        config.currentSection &&
        currentSection !== config.currentSection
      ) {
        updateNavigationHistory(currentSection);
        updateLastValidSection(currentSection);
      }

      config.currentSection = currentSection;
      updateActiveNavLinks();

      dispatchEvent("section:changed", {
        section: currentSection,
      });
    }
  }
  function updateActiveNavLinks() {
    elements.navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === `#${config.currentSection}`) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateScrollIndicator() {
    if (!elements.navScrollIndicator) return;

    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (window.scrollY / scrollHeight) * 100;
    elements.navScrollIndicator.style.width = `${scrollPercent}%`;
  }

  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================

  function handleNavLinkClick(event) {
    event.preventDefault();

    const targetId = this.getAttribute("href");
    if (!targetId || targetId === "#") return;

    // إغلاق القائمة المتنقلة إذا كانت مفتوحة
    closeMobileMenu();

    // التنقل للقسم (مع إضافة التاريخ تلقائيًا)
    scrollToSection(targetId, true);

    // تحديث الرابط دون إعادة تحميل
    if (history.pushState) {
      history.pushState(null, null, targetId);
    }
  }
  function handleCTAClick(event) {
    // Track CTA clicks if analytics are added later
    dispatchEvent("cta:clicked", {
      type: this.classList.contains("nav-cta") ? "desktop" : "mobile",
      text: this.textContent.trim(),
    });
  }
  function scrollToSection(sectionId, addToHistory = true) {
    // إضافة تحقق من sectionId
    if (!sectionId || typeof sectionId !== "string") {
      console.error("معرف القسم غير صالح:", sectionId);
      return false;
    }
    // تنظيف المعرف إذا كان يحتوي على #
    const cleanSectionId = sectionId.replace("#", "");

    // البحث عن القسم
    const targetElement = document.getElementById(cleanSectionId);

    // إذا القسم غير موجود، استخدم آخر قسم صالح
    if (!targetElement) {
      logNavigationError("section_not_found", cleanSectionId, {
        action: "fallback_to_last_valid",
        lastValidSection: lastValidSection,
      });
      console.warn(
        `القسم "${cleanSectionId}" غير موجود. العودة إلى آخر قسم صالح.`
      );

      // إذا لم يكن هناك قسم صالح سابق، انتقل للأول
      if (!lastValidSection) {
        return navigateToFirstSection();
      }

      // استخدام آخر قسم صالح
      return scrollToValidSection(lastValidSection, false, "fallback");
    }

    // إذا القسم موجود، قم بالتنقل إليه
    return scrollToValidSection(cleanSectionId, addToHistory, "direct");
  }

  // دالة جديدة: التنقل للقسم مع تحديث التاريخ
  function scrollToValidSection(
    sectionId,
    addToHistory = true,
    source = "direct"
  ) {
    const targetElement = document.getElementById(sectionId);

    if (!targetElement) {
      console.error(`القسم "${sectionId}" غير موجود حتى بعد التحقق`);
      return false;
    }

    const navbarHeight = elements.navbar ? elements.navbar.offsetHeight : 0;
    const targetPosition = targetElement.offsetTop - navbarHeight;

    // تحديث التاريخ إذا مطلوب
    if (addToHistory && config.currentSection !== sectionId) {
      updateNavigationHistory(sectionId);
    }

    // تحديث آخر قسم صالح
    updateLastValidSection(sectionId);

    // التمرير للقسم
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    // تحديث القسم الحالي فورًا
    config.currentSection = sectionId;
    updateActiveNavLinks();

    // إرسال حدث
    dispatchEvent("section:navigated", {
      sectionId: sectionId,
      source: source,
      previousSection:
        navigationHistory.length > 1
          ? navigationHistory[navigationHistory.length - 2]
          : null,
    });

    return true;
  }

  // دالة جديدة: تحديث سجل التنقل
  function updateNavigationHistory(sectionId) {
    // تجنب تكرار الأقسام المتتالية
    if (
      navigationHistory.length > 0 &&
      navigationHistory[navigationHistory.length - 1] === sectionId
    ) {
      return;
    }

    navigationHistory.push(sectionId);

    // تحديد حجم السجل
    if (navigationHistory.length > NAV_HISTORY_MAX) {
      navigationHistory = navigationHistory.slice(-NAV_HISTORY_MAX);
    }

    // حفظ السجل في التخزين المحلي
    localStorage.setItem(
      NAV_CONFIG.STORAGE_KEYS.HISTORY,
      JSON.stringify(navigationHistory)
    );

    dispatchEvent("history:updated", {
      history: navigationHistory,
      lastItem: sectionId,
    });
  }

  // دالة جديدة: تحديث آخر قسم صالح
  function updateLastValidSection(sectionId) {
    lastValidSection = sectionId;
    saveLastValidSection();

    dispatchEvent("lastValidSection:updated", {
      sectionId: sectionId,
    });
  }

  // دالة جديدة: التنقل للقسم الأول
  function navigateToFirstSection() {
    const allSections = document.querySelectorAll("section[id]");

    if (allSections.length === 0) {
      console.error("لا توجد أقسام في الصفحة");
      return false;
    }

    const firstSection = allSections[0];
    return scrollToValidSection(firstSection.id, true, "fallback-first");
  }

  // ============================================
  // LANGUAGE FUNCTIONS
  // ============================================

  function handleLanguageToggle(event) {
    event.preventDefault();

    // Toggle language
    config.preferredLang = config.preferredLang === "ar" ? "en" : "ar";

    // Update UI
    updateLanguageUI();

    // Save preference
    saveLanguagePreference();

    // Dispatch event
    dispatchEvent("language:changed", {
      language: config.preferredLang,
    });
  }

  function updateLanguageUI() {
    const html = document.documentElement;

    // Update HTML attributes
    html.setAttribute("lang", config.preferredLang);
    html.setAttribute("dir", config.preferredLang === "ar" ? "rtl" : "ltr");

    // Toggle text visibility
    document.querySelectorAll(".ar, .en").forEach((element) => {
      if (
        element.classList.contains(config.preferredLang === "ar" ? "ar" : "en")
      ) {
        element.classList.remove("hidden");
      } else {
        element.classList.add("hidden");
      }
    });

    // Update chevron directions if slider exists
    updateChevronDirections();
  }

  function updateChevronDirections() {
    const html = document.documentElement;
    const prevIcons = document.querySelectorAll(".prev-btn i");
    const nextIcons = document.querySelectorAll(".next-btn i");

    prevIcons.forEach((icon) => {
      if (html.getAttribute("dir") === "rtl") {
        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");
      } else {
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");
      }
    });

    nextIcons.forEach((icon) => {
      if (html.getAttribute("dir") === "rtl") {
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-left");
      } else {
        icon.classList.remove("fa-chevron-left");
        icon.classList.add("fa-chevron-right");
      }
    });
  }

  function loadLanguagePreference() {
    const savedLang = localStorage.getItem("summitPreferredLang");
    if (savedLang && (savedLang === "ar" || savedLang === "en")) {
      config.preferredLang = savedLang;
      updateLanguageUI();
    }
  }

  function saveLanguagePreference() {
    localStorage.setItem("summitPreferredLang", config.preferredLang);
  }

  // ============================================
  // RESIZE & VIEWPORT FUNCTIONS
  // ============================================

  function handleResize() {
    checkMobileView();

    // Close mobile menu if switching to desktop view
    if (window.innerWidth > 991 && config.isMobileMenuOpen) {
      closeMobileMenu();
    }
  }

  function checkMobileView() {
    const isMobile = window.innerWidth <= 991;

    // Update navbar height variable if needed
    if (elements.navbar) {
      if (isMobile) {
        document.documentElement.style.setProperty(
          "--nav-height-current",
          "var(--nav-height-mobile)"
        );
      } else {
        document.documentElement.style.setProperty(
          "--nav-height-current",
          "var(--nav-height-desktop)"
        );
      }
    }
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  function handleKeyboardNavigation(event) {
    // Close mobile menu with Escape
    if (event.key === "Escape" && config.isMobileMenuOpen) {
      closeMobileMenu();
    }

    // Navigate with arrow keys when menu is open
    if (
      config.isMobileMenuOpen &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      navigateMobileMenu(event.key);
    }
  }

  function navigateMobileMenu(direction) {
    const currentLink = document.activeElement;
    const allLinks = Array.from(
      elements.mobileMenu.querySelectorAll(".nav-link, .mobile-cta, .lang-btn")
    );

    if (!allLinks.length) return;

    const currentIndex = allLinks.indexOf(currentLink);
    let nextIndex;

    if (direction === "ArrowDown") {
      nextIndex = currentIndex < allLinks.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : allLinks.length - 1;
    }

    if (allLinks[nextIndex]) {
      allLinks[nextIndex].focus();
    }
  }

  // ============================================
  // TOCH EVENTS FOR MOBILE
  // ============================================

  function setupTouchEvents() {
    // Add touch feedback to nav links
    elements.navLinks.forEach((link) => {
      link.addEventListener("touchstart", function () {
        this.classList.add("touch-active");
      });

      link.addEventListener("touchend", function () {
        this.classList.remove("touch-active");
      });
    });

    // Prevent body scroll when menu is open
    elements.mobileMenu?.addEventListener(
      "touchmove",
      function (event) {
        if (config.isMobileMenuOpen) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  }

  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================

  function debounce(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(config.scrollDebounceTimer);
        func(...args);
      };
      clearTimeout(config.scrollDebounceTimer);
      config.scrollDebounceTimer = setTimeout(later, wait);
    };
  }

  // ============================================
  // EVENT DISPATCHING
  // ============================================

  function dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, navigation: this },
    });
    document.dispatchEvent(event);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    // Initialization
    init: init,

    // State getters
    getState: () => ({ ...config }),

    // Navigation controls
    scrollToSection: scrollToSection,
    toggleMobileMenu: toggleMobileMenu,
    closeMobileMenu: closeMobileMenu,

    // Language controls
    toggleLanguage: handleLanguageToggle,
    getCurrentLanguage: () => config.preferredLang,

    // Section controls
    getCurrentSection: () => config.currentSection,

    // Performance
    debounce: debounce,
    // إضافة دوال جديدة
    getLastValidSection: () => lastValidSection,
    getNavigationHistory: () => [...navigationHistory],
    goToLastValidSection: function () {
      if (lastValidSection) {
        return scrollToSection(`#${lastValidSection}`, false);
      }
      return false;
    },
    goBackInHistory: function () {
      if (navigationHistory.length < 2) {
        console.info("لا يوجد سجل تنقل سابق");
        return false;
      }

      // إزالة الحالي
      navigationHistory.pop();

      // الرجوع للقسم السابق
      const previousSection = navigationHistory.pop();
      if (previousSection) {
        return scrollToSection(`#${previousSection}`, false);
      }
      return false;
    },
    clearNavigationHistory: function () {
      navigationHistory = [];
      localStorage.removeItem(NAV_CONFIG.STORAGE_KEYS.HISTORY);
      dispatchEvent("history:cleared");
    },

    // دالة جديدة: مسح سجل الأخطاء
    clearErrorLog: function () {
      localStorage.removeItem("summitNavErrors");
      console.log("تم مسح سجل الأخطاء");
    },

    // دالة جديدة: الحصول على سجل الأخطاء
    getErrorLog: function () {
      return JSON.parse(localStorage.getItem("summitNavErrors") || "[]");
    },
  };
})();

// ============================================
// GLOBAL EXPORT FOR MODULAR USE
// ============================================

// Export as ES6 module if supported
if (typeof module !== "undefined" && module.exports) {
  module.exports = NavigationSystem;
}

// Export as AMD module if supported
if (typeof define === "function" && define.amd) {
  define([], function () {
    return NavigationSystem;
  });
}

// Export as global for traditional use
window.SummitNavigation = NavigationSystem;

// ============================================
// AUTO-INITIALIZATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
      NavigationSystem.init();
    }, 100);
  });
} else {
  setTimeout(() => {
    NavigationSystem.init();
  }, 100);
}

// ============================================
// PERFORMANCE OPTIMIZATIONS ON LOAD
// ============================================

// Optimize for initial load
window.addEventListener("load", function () {
  // Use requestIdleCallback for non-critical tasks
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      // Preload navigation images if any
      const navImages = document.querySelectorAll(".navbar-logo[data-src]");
      navImages.forEach((img) => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
    });
  }
});

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Respect reduced motion preference
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.style.setProperty("--nav-transition", "none");
  document.documentElement.style.setProperty("--menu-transition", "none");
}

// ============================================
// END OF NAVIGATION SYSTEM
// ============================================
