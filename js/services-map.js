/**
 * SERVICES & MAP INTERACTIVITY SYSTEM
 * نظام تفاعلي للخدمات متعددة التوسيع + خريطة متعددة العلامات
 * تم إنشاؤه باستخدام نظام شركة سومت العالمية
 * الإصدار: 1.0.0
 */

// ============================================
// INTERACTIVE SERVICES SYSTEM
// ============================================

class InteractiveServices {
  constructor() {
    this.grid = document.getElementById('servicesGrid');
    this.cards = Array.from(document.querySelectorAll('.service-card'));
    this.toggles = Array.from(document.querySelectorAll('.service-toggle, .close-details'));
    this.expandAllBtn = document.getElementById('expandAll');
    this.collapseAllBtn = document.getElementById('collapseAll');
    this.activeCard = null;
    this.animationDuration = 300;
    
    this.init();
  }
  
  init() {
    // التحقق من وجود العناصر
    if (!this.grid || !this.cards.length) {
      console.warn('InteractiveServices: لا توجد عناصر خدمات للتهيئة');
      return;
    }

    this.bindEvents();
    this.updateGridState();
    this.dispatchEvent('services:ready');
  }
  
  bindEvents() {
    // Card click events
    this.cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.service-toggle, .close-details')) {
          this.toggleCard(card);
        }
      });
    });
    
    // Toggle button events
    this.toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = toggle.closest('.service-card');
        
        if (toggle.dataset.action === 'expand') {
          this.expandCard(card);
        } else {
          this.collapseCard(card);
        }
      });
    });
    
    // Expand/Collapse all buttons
    if (this.expandAllBtn) {
      this.expandAllBtn.addEventListener('click', () => this.expandAll());
    }
    
    if (this.collapseAllBtn) {
      this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeCard) {
        this.collapseCard(this.activeCard);
      }
    });
  }
  
  toggleCard(card) {
    if (card.classList.contains('active')) {
      this.collapseCard(card);
    } else {
      this.expandCard(card);
    }
  }
  
  expandCard(card) {
    // إغلاق البطاقة النشطة الحالية إذا كانت مختلفة
    if (this.activeCard && this.activeCard !== card) {
      this.collapseCard(this.activeCard);
    }
    
    // تعيين الحالة النشطة
    this.activeCard = card;
    card.classList.add('active');
    card.classList.remove('inactive');
    
    // تحديث باقي البطاقات
    this.cards.forEach(c => {
      if (c !== card) {
        c.classList.add('inactive');
        c.classList.remove('active');
      }
    });
    
    this.updateGridState();
    this.dispatchEvent('service:expand', { card });
    
    // التمرير للبطاقة على الشاشات الصغيرة
    if (window.innerWidth < 992) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, this.animationDuration);
    }
  }
  
  collapseCard(card) {
    card.classList.remove('active');
    
    if (this.activeCard === card) {
      this.activeCard = null;
    }
    
    // إعادة تعيين باقي البطاقات
    this.cards.forEach(c => {
      if (c !== card) {
        c.classList.remove('inactive');
      }
    });
    
    this.updateGridState();
    this.dispatchEvent('service:collapse', { card });
  }
  
  expandAll() {
    this.cards.forEach(card => {
      card.classList.add('active');
      card.classList.remove('inactive');
    });
    
    this.grid.classList.add('all-expanded');
    this.dispatchEvent('services:expandAll');
  }
  
  collapseAll() {
    this.cards.forEach(card => {
      card.classList.remove('active', 'inactive');
    });
    
    this.activeCard = null;
    this.grid.classList.remove('all-expanded');
    this.updateGridState();
    this.dispatchEvent('services:collapseAll');
  }
  
  updateGridState() {
    const hasActive = this.cards.some(card => card.classList.contains('active'));
    if (hasActive) {
      this.grid.classList.add('has-active');
    } else {
      this.grid.classList.remove('has-active');
    }
  }
  
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, system: this }
    });
    document.dispatchEvent(event);
  }
}

// ============================================
// INTERACTIVE MAP SYSTEM
// ============================================

class InteractiveMap {
  constructor() {
    this.map = document.getElementById('interactiveMap');
    this.markers = Array.from(document.querySelectorAll('.map-marker'));
    this.mapControls = {
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      reset: document.getElementById('resetMap'),
      toggleType: document.getElementById('toggleMapType')
    };
    
    this.directionsBtn = document.getElementById('getDirections');
    this.copyAddressBtn = document.getElementById('copyAddress');
    
    this.activeMarker = null;
    this.mapType = 'roadmap';
    this.zoomLevel = 14;
    this.defaultLocation = {
      lat: '29.2985',
      lng: '47.6855'
    };
    
    this.init();
  }
  
  init() {
    if (!this.map) {
      console.warn('InteractiveMap: لا توجد خريطة للتهيئة');
      return;
    }

    this.bindEvents();
    this.initMarkers();
    this.dispatchEvent('map:ready');
  }
  
  bindEvents() {
    // أحداث العلامات
    this.markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activateMarker(marker);
      });
      
      marker.addEventListener('mouseenter', () => {
        if (!marker.classList.contains('active')) {
          marker.classList.add('hover');
        }
      });
      
      marker.addEventListener('mouseleave', () => {
        marker.classList.remove('hover');
      });
    });
    
    // تحكمات الخريطة
    Object.entries(this.mapControls).forEach(([key, element]) => {
      if (element) {
        element.addEventListener('click', () => this[key]());
      }
    });
    
    // أزرار الإجراءات
    if (this.directionsBtn) {
      this.directionsBtn.addEventListener('click', () => this.getDirections());
    }
    
    if (this.copyAddressBtn) {
      this.copyAddressBtn.addEventListener('click', () => this.copyAddress());
    }
    
    // إغلاق العلامة النشطة بالنقر خارجها
    document.addEventListener('click', (e) => {
      if (this.activeMarker && 
          !this.activeMarker.contains(e.target) && 
          !e.target.closest('.map-controls')) {
        this.deactivateMarker(this.activeMarker);
      }
    });
    
    // إغلاق بمفتاح ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeMarker) {
        this.deactivateMarker(this.activeMarker);
      }
    });
  }
  
  initMarkers() {
    // إضافة تأثير النبض للمكتب الرئيسي
    const officeMarker = this.markers.find(m => m.dataset.marker === 'office');
    if (officeMarker) {
      officeMarker.classList.add('pulse-marker');
    }
  }
  
  activateMarker(marker) {
    // إلغاء تفعيل العلامة النشطة الحالية
    if (this.activeMarker && this.activeMarker !== marker) {
      this.deactivateMarker(this.activeMarker);
    }
    
    // التبديل إذا كانت نفس العلامة
    if (this.activeMarker === marker) {
      this.deactivateMarker(marker);
      return;
    }
    
    // تفعيل العلامة الجديدة
    marker.classList.add('active');
    marker.classList.remove('hover');
    this.activeMarker = marker;
    
    // مركزة الخريطة على العلامة
    this.centerOnMarker(marker);
    
    // تحديث معلومات العلامة
    this.updateMarkerInfo(marker);
    
    this.dispatchEvent('marker:activate', { marker });
  }
  
  deactivateMarker(marker) {
    marker.classList.remove('active');
    
    if (this.activeMarker === marker) {
      this.activeMarker = null;
    }
    
    this.dispatchEvent('marker:deactivate', { marker });
  }
  
  centerOnMarker(marker) {
    const lat = marker.dataset.lat || this.defaultLocation.lat;
    const lng = marker.dataset.lng || this.defaultLocation.lng;
    
    this.updateMapView(lat, lng, this.zoomLevel);
  }
  
  updateMapView(lat, lng, zoom = 14) {
    const mapType = this.mapType === 'satellite' ? 'satellite' : 'roadmap';
    const language = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    
    // إنشاء رابط جديد للخريطة
    const newSrc = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=${zoom}&maptype=${mapType}&language=${language}`;
    
    this.map.src = newSrc;
    this.zoomLevel = zoom;
  }
  
  zoomIn() {
    if (this.zoomLevel < 20) {
      this.zoomLevel++;
      this.updateMapView(this.defaultLocation.lat, this.defaultLocation.lng, this.zoomLevel);
      this.dispatchEvent('map:zoomIn', { zoom: this.zoomLevel });
    }
  }
  
  zoomOut() {
    if (this.zoomLevel > 1) {
      this.zoomLevel--;
      this.updateMapView(this.defaultLocation.lat, this.defaultLocation.lng, this.zoomLevel);
      this.dispatchEvent('map:zoomOut', { zoom: this.zoomLevel });
    }
  }
  
  resetMap() {
    this.zoomLevel = 14;
    this.mapType = 'roadmap';
    
    // إغلاق أي علامة نشطة
    if (this.activeMarker) {
      this.deactivateMarker(this.activeMarker);
    }
    
    // إعادة الخريطة إلى الحالة الافتراضية
    this.updateMapView(this.defaultLocation.lat, this.defaultLocation.lng, 14);
    
    // تحديث زر تبديل النوع
    if (this.mapControls.toggleType) {
      this.mapControls.toggleType.classList.remove('active');
      this.mapControls.toggleType.innerHTML = '<i class="fas fa-layer-group"></i>';
      this.mapControls.toggleType.title = this.getLocalizedText('تبديل إلى القمر الصناعي', 'Switch to Satellite');
    }
    
    // إعادة تعيين معلومات الخريطة
    this.updateMapInfo();
    
    this.dispatchEvent('map:reset');
  }
  
  toggleMapType() {
    const toggleBtn = this.mapControls.toggleType;
    
    if (this.mapType === 'roadmap') {
      this.mapType = 'satellite';
      toggleBtn.classList.add('active');
      toggleBtn.innerHTML = '<i class="fas fa-map"></i>';
      toggleBtn.title = this.getLocalizedText('تبديل إلى الخريطة العادية', 'Switch to Road Map');
    } else {
      this.mapType = 'roadmap';
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
      toggleBtn.title = this.getLocalizedText('تبديل إلى القمر الصناعي', 'Switch to Satellite View');
    }
    
    this.updateMapView(this.defaultLocation.lat, this.defaultLocation.lng, this.zoomLevel);
    this.dispatchEvent('map:typeToggle', { type: this.mapType });
  }
  
  getDirections() {
    const address = encodeURIComponent('الفحيحيل شارع مكة قطعة ٧ قسيمة ٧٣٠١، الكويت');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    this.dispatchEvent('map:getDirections', { address });
  }
  
  copyAddress() {
    const address = 'الفحيحيل شارع مكة قطعة ٧ قسيمة ٧٣٠١، الكويت';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address)
        .then(() => this.showCopyFeedback())
        .catch(() => this.copyWithFallback(address));
    } else {
      this.copyWithFallback(address);
    }
  }
  
  copyWithFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (err) {
      console.error('فشل نسخ العنوان:', err);
    }
    
    document.body.removeChild(textArea);
  }
  
  showCopyFeedback() {
    const originalHTML = this.copyAddressBtn.innerHTML;
    const originalClass = this.copyAddressBtn.className;
    
    this.copyAddressBtn.innerHTML = this.getLocalizedText(
      '<i class="fas fa-check"></i> تم النسخ',
      '<i class="fas fa-check"></i> Copied'
    );
    this.copyAddressBtn.classList.add('copied');
    
    setTimeout(() => {
      this.copyAddressBtn.innerHTML = originalHTML;
      this.copyAddressBtn.className = originalClass;
    }, 2000);
  }
  
  updateMarkerInfo(marker) {
    const infoContainer = document.querySelector('.map-info');
    if (!infoContainer) return;
    
    const label = marker.querySelector('.marker-label');
    const icon = marker.querySelector('.marker-icon i');
    
    if (label && icon) {
      infoContainer.innerHTML = `
        <h4>${label.innerHTML}</h4>
        <p>
          <i class="${icon.className}"></i>
          ${this.getLocalizedText('مشروع في الكويت', 'Project in Kuwait')}
        </p>
      `;
    }
  }
  
  updateMapInfo() {
    const infoContainer = document.querySelector('.map-info');
    if (!infoContainer) return;
    
    infoContainer.innerHTML = `
      <h4>${this.getLocalizedText('مكتب شركة سومت العالمية', 'Summit International Company Office')}</h4>
      <p>
        <i class="fas fa-map-marker-alt"></i>
        ${this.getLocalizedText(
          'الفحيحيل شارع مكة قطعة ٧ قسيمة ٧٣٠١',
          'Al-Fahaheel, Makkah Street, Piece 7, Plot 7301'
        )}
      </p>
      <p>
        <i class="fas fa-phone"></i>
        <span>+965 6041 5151</span>
      </p>
    `;
  }
  
  getLocalizedText(arText, enText) {
    return document.documentElement.lang === 'ar' ? arText : enText;
  }
  
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, system: this }
    });
    document.dispatchEvent(event);
  }
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

function optimizeServicesMap() {
  // Lazy loading لصور الخدمات
  const serviceImages = document.querySelectorAll('.media-image[data-src]');
  
  if ('IntersectionObserver' in window && serviceImages.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    serviceImages.forEach(img => observer.observe(img));
  }
  
  // تحسين will-change للعناصر التفاعلية
  const interactiveElements = document.querySelectorAll(
    '.service-card, .service-toggle, .map-marker, .map-btn'
  );
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.willChange = 'transform, opacity, background-color';
    });
    
    el.addEventListener('mouseleave', () => {
      setTimeout(() => {
        el.style.willChange = 'auto';
      }, 300);
    });
  });
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

function enhanceAccessibility() {
  // احترام تفضيلات الحركة المخفّضة
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const animatedElements = document.querySelectorAll(
      '.service-card, .service-details, .map-marker'
    );
    
    animatedElements.forEach(el => {
      el.style.transition = 'none';
    });
  }
  
  // تحسين التنقل بلوحة المفاتيح للخدمات
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextCard = serviceCards[(index + 1) % serviceCards.length];
        nextCard.focus();
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevCard = serviceCards[(index - 1 + serviceCards.length) % serviceCards.length];
        prevCard.focus();
      }
    });
  });
  
  // ARIA labels للخريطة
  const mapIframe = document.getElementById('interactiveMap');
  if (mapIframe) {
    mapIframe.setAttribute('title', 'خريطة موقع شركة سومت العالمية ومشاريعها');
    mapIframe.setAttribute('aria-label', 'خريطة تفاعلية تظهر موقع الشركة ومشاريعها في الكويت');
  }
  
  // ARIA labels للعلامات
  document.querySelectorAll('.map-marker').forEach((marker, index) => {
    const label = marker.querySelector('.marker-label .ar')?.textContent || 
                  marker.querySelector('.marker-label .en')?.textContent ||
                  `علامة ${index + 1}`;
    
    marker.setAttribute('aria-label', label);
    marker.setAttribute('role', 'button');
  });
}

// ============================================
// LANGUAGE SUPPORT
// ============================================

function handleLanguageChange() {
  document.addEventListener('language:changed', () => {
    // تحديث نصوص أزرار الخدمات
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
    
    [expandAllBtn, collapseAllBtn].forEach(btn => {
      if (btn) {
        const isArabic = document.documentElement.lang === 'ar';
        btn.querySelector('.ar').classList.toggle('hidden', !isArabic);
        btn.querySelector('.en').classList.toggle('hidden', isArabic);
      }
    });
    
    // تحديث أزرار الخريطة
    const copyAddressBtn = document.getElementById('copyAddress');
    const directionsBtn = document.getElementById('getDirections');
    
    if (copyAddressBtn) {
      copyAddressBtn.querySelector('.ar').classList.toggle('hidden', !isArabic);
      copyAddressBtn.querySelector('.en').classList.toggle('hidden', isArabic);
    }
    
    if (directionsBtn) {
      directionsBtn.querySelector('.ar').classList.toggle('hidden', !isArabic);
      directionsBtn.querySelector('.en').classList.toggle('hidden', isArabic);
    }
  });
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

class ServicesMapSystem {
  constructor() {
    this.services = null;
    this.map = null;
  }
  
  init() {
    try {
      // تهيئة نظام الخدمات
      this.services = new InteractiveServices();
      
      // تهيئة نظام الخريطة
      this.map = new InteractiveMap();
      
      // تحسينات الأداء
      optimizeServicesMap();
      
      // تحسينات الوصولية
      enhanceAccessibility();
      
      // دعم تغيير اللغة
      handleLanguageChange();
      
      // حفظ المرجع للنظام العام
      window.SummitServicesMap = this;
      
      this.dispatchEvent('servicesMap:ready', {
        services: this.services,
        map: this.map
      });
      
      console.log('✅ نظام الخدمات والخرائط جاهز للعمل');
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام الخدمات والخرائط:', error);
    }
  }
  
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, system: this }
    });
    document.dispatchEvent(event);
  }
  
  // Public API
  getServices() {
    return this.services;
  }
  
  getMap() {
    return this.map;
  }
}

// ============================================
// AUTO INITIALIZATION
// ============================================

function initializeServicesMap() {
  // الانتظار حتى تحميل DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSystem, 100);
    });
  } else {
    setTimeout(initSystem, 100);
  }
}

function initSystem() {
  // التحقق من وجود العناصر الأساسية
  const hasServices = document.getElementById('servicesGrid');
  const hasMap = document.getElementById('interactiveMap');
  
  if (!hasServices && !hasMap) {
    console.warn('⚠️ لم يتم العثور على عناصر الخدمات أو الخريطة');
    return;
  }
  
  // إنشاء النظام
  const system = new ServicesMapSystem();
  system.init();
}

// التهيئة التلقائية
initializeServicesMap();

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (e) => {
  console.error('حدث خطأ في نظام الخدمات والخرائط:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('رفض غير معالج في نظام الخدمات والخرائط:', e.reason);
});

// ============================================
// PUBLIC API EXAMPLES
// ============================================

/*
// أمثلة لاستخدام API من الكونسول:

// 1. الوصول للنظام
window.SummitServicesMap.getServices().expandAll();
window.SummitServicesMap.getServices().collapseAll();

// 2. التحكم في الخريطة
window.SummitServicesMap.getMap().zoomIn();
window.SummitServicesMap.getMap().zoomOut();
window.SummitServicesMap.getMap().resetMap();

// 3. تفعيل علامة معينة
const markers = document.querySelectorAll('.map-marker');
window.SummitServicesMap.getMap().activateMarker(markers[0]);

// 4. الحصول على معلومات
const activeService = window.SummitServicesMap.getServices().activeCard;
const activeMarker = window.SummitServicesMap.getMap().activeMarker;
*/

// ============================================
// UTILITY FUNCTIONS
// ============================================

// دالة مساعدة لإضافة علامة ديناميكية
function addDynamicMarker(options) {
  const markersContainer = document.querySelector('.custom-markers');
  if (!markersContainer || !window.SummitServicesMap) return null;
  
  const marker = document.createElement('div');
  marker.className = 'map-marker';
  marker.dataset.lat = options.lat || '29.2985';
  marker.dataset.lng = options.lng || '47.6855';
  marker.dataset.marker = options.id || `marker-${Date.now()}`;
  marker.style.top = options.top || '50%';
  marker.style.left = options.left || '50%';
  
  marker.innerHTML = `
    <div class="marker-icon">
      <i class="${options.icon || 'fas fa-map-marker-alt'}"></i>
    </div>
    <div class="marker-label">
      <span class="ar">${options.labelAr || 'علامة جديدة'}</span>
      <span class="en hidden">${options.labelEn || 'New Marker'}</span>
    </div>
  `;
  
  markersContainer.appendChild(marker);
  
  // إعادة تهيئة النظام لالتقاط العلامة الجديدة
  window.SummitServicesMap.getMap().markers = Array.from(document.querySelectorAll('.map-marker'));
  window.SummitServicesMap.getMap().bindMarkerEvents(marker);
  
  return marker;
}

// ============================================
// EXPORT FOR MODULAR USE
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ServicesMapSystem,
    InteractiveServices,
    InteractiveMap,
    addDynamicMarker
  };
}