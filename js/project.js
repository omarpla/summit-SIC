/**
 * PROJECTS SYSTEM - نظام متكامل لإدارة المشاريع
 * تم إنشاؤه باستخدام نظام شركة سومت العالمية
 * الإصدار: 1.0.0
 */

// ============================================
// CONFIGURATION & INITIALIZATION
// ============================================

class ProjectsSystem {
  constructor() {
    this.config = {
      itemsPerPage: 6,
      currentPage: 1,
      totalPages: 1,
      filter: 'all',
      isRTL: document.documentElement.dir === 'rtl',
      animationDuration: 300
    };
    
    this.elements = {
      grid: document.getElementById('projectsGridMain'),
      filterButtons: document.querySelectorAll('.filter-btn'),
      loadMoreBtn: document.getElementById('loadMoreProjects'),
      viewAllBtn: document.getElementById('viewAllProjects'),
      noProjectsMessage: document.querySelector('.no-projects-message'),
      featuredSlider: document.querySelector('.featured-projects .owl-carousel'),
      projectsCount: document.getElementById('projectsCount'),
      loadingIndicator: null // سيتم إنشاؤه ديناميكياً
    };
    
    this.projects = [];
    this.filteredProjects = [];
    this.featuredProjects = [];
    
    this.init();
  }
  
  // ============================================
  // INITIALIZATION METHODS
  // ============================================
  
  init() {
    // 1. التحقق من العناصر الأساسية
    if (!this.elements.grid) {
      console.warn('ProjectsSystem: لم يتم العثور على شبكة المشاريع');
      return;
    }
    
    // 2. استخراج المشاريع من HTML
    this.extractProjectsFromDOM();
    
    // 3. تهيئة نظام الفلترة
    this.initFilterSystem();
    
    // 4. تهيئة نظام التحميل التدريجي
    this.initLoadMoreSystem();
    
    // 5. تهيئة الكاروسيل للمشاريع المميزة
    this.initFeaturedSlider();
    
    // 6. إنشاء مؤشر التحميل
    this.createLoadingIndicator();
    
    // 7. تحديث العداد والعرض الأولي
    this.updateProjectsCounter();
    this.renderProjects();
    
    // 8. إرسال حدث التهيئة
    this.dispatchEvent('projects:initialized', {
      totalProjects: this.projects.length,
      filteredProjects: this.filteredProjects.length
    });
  }
  
  extractProjectsFromDOM() {
    const projectCards = document.querySelectorAll('.project-card-enhanced');
    
    this.projects = Array.from(projectCards).map((card, index) => {
      const project = {
        id: index + 1,
        element: card,
        category: card.dataset.category || 'all',
        title: card.querySelector('.project-title')?.textContent.trim() || '',
        description: card.querySelector('.project-description')?.textContent.trim() || '',
        date: card.querySelector('.project-date span')?.textContent.trim() || '',
        image: card.querySelector('.project-image')?.src || '',
        badge: card.querySelector('.project-badge')?.textContent.trim() || '',
        isFeatured: card.dataset.featured === 'true'
      };
      
      // إضافة event listener لبطاقة المشروع
      this.addProjectCardListeners(card);
      
      return project;
    });
    
    // فصل المشاريع المميزة
    this.featuredProjects = this.projects.filter(project => project.isFeatured);
    this.filteredProjects = [...this.projects];
    this.config.totalPages = Math.ceil(this.projects.length / this.config.itemsPerPage);
  }
  
  addProjectCardListeners(card) {
    // النقر على رابط الاستفسار
    const projectLink = card.querySelector('.project-link');
    if (projectLink) {
      projectLink.addEventListener('click', (e) => {
        e.preventDefault();
        const projectTitle = card.querySelector('.project-title').textContent;
        this.dispatchEvent('project:inquiry', { title: projectTitle });
        
        // التمرير إلى قسم الاتصال
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    
    // تأثير hover
    card.addEventListener('mouseenter', () => {
      card.classList.add('hover');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hover');
    });
  }
  
  // ============================================
  // FILTER SYSTEM
  // ============================================
  
  initFilterSystem() {
    if (!this.elements.filterButtons.length) return;
    
    this.elements.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // إلغاء تفعيل جميع الأزرار
        this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // تفعيل الزر المحدد
        button.classList.add('active');
        
        // تحديث الفلتر الحالي
        this.config.filter = button.dataset.filter;
        this.config.currentPage = 1;
        
        // تطبيق الفلتر
        this.applyFilter();
        
        // إرسال حدث التغيير
        this.dispatchEvent('filter:changed', { filter: this.config.filter });
      });
    });
  }
  
  applyFilter() {
    if (this.config.filter === 'all') {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(project => 
        project.category === this.config.filter
      );
    }
    
    // تحديث العدد الإجمالي للصفحات
    this.config.totalPages = Math.ceil(this.filteredProjects.length / this.config.itemsPerPage);
    
    // تحديث العرض
    this.renderProjects();
    
    // تحديث العداد
    this.updateProjectsCounter();
    
    // التحقق من حالة عدم وجود مشاريع
    this.checkEmptyState();
  }
  
  // ============================================
  // LOAD MORE SYSTEM
  // ============================================
  
  initLoadMoreSystem() {
    if (!this.elements.loadMoreBtn) return;
    
    this.elements.loadMoreBtn.addEventListener('click', () => {
      this.loadMoreProjects();
    });
    
    // تحديث حالة الزر
    this.updateLoadMoreButton();
  }
  
  loadMoreProjects() {
    if (this.config.currentPage >= this.config.totalPages) return;
    
    // إظهار مؤشر التحميل
    this.showLoading(true);
    
    // محاكاة تأخير الشبكة
    setTimeout(() => {
      this.config.currentPage++;
      
      // إعادة عرض المشاريع مع الصفحة الجديدة
      this.renderProjects();
      
      // إخفاء مؤشر التحميل
      this.showLoading(false);
      
      // تحديث زر التحميل
      this.updateLoadMoreButton();
      
      // إرسال حدث التحميل
      this.dispatchEvent('projects:loadedMore', {
        currentPage: this.config.currentPage,
        totalPages: this.config.totalPages
      });
    }, 800);
  }
  
  updateLoadMoreButton() {
    if (!this.elements.loadMoreBtn) return;
    
    const isArabic = document.documentElement.lang === 'ar';
    
    if (this.config.currentPage >= this.config.totalPages) {
      this.elements.loadMoreBtn.disabled = true;
      this.elements.loadMoreBtn.innerHTML = `
        <i class="fas fa-check"></i>
        <span class="ar">تم عرض كل المشاريع</span>
        <span class="en hidden">All Projects Loaded</span>
      `;
    } else {
      this.elements.loadMoreBtn.disabled = false;
      this.elements.loadMoreBtn.innerHTML = `
        <i class="fas fa-plus"></i>
        <span class="ar">تحميل المزيد</span>
        <span class="en hidden">Load More</span>
      `;
    }
  }
  
  // ============================================
  // FEATURED SLIDER (OWL CAROUSEL)
  // ============================================
  
  initFeaturedSlider() {
    // إنشاء عناصر المشاريع المميزة ديناميكياً إذا لم تكن موجودة
    this.createFeaturedSliderContent();
    
    // تهيئة Owl Carousel إذا كانت المكتبة موجودة
    if (window.jQuery && $.fn.owlCarousel && this.elements.featuredSlider) {
      this.initOwlCarousel();
    }
  }
  
  createFeaturedSliderContent() {
    const sliderContainer = this.elements.featuredSlider;
    if (!sliderContainer || this.featuredProjects.length === 0) return;
    
    // مسح المحتوى الحالي
    sliderContainer.innerHTML = '';
    
    // إضافة المشاريع المميزة
    this.featuredProjects.forEach((project, index) => {
      if (index < 6) { // عرض 6 مشاريع كحد أقصى
        const slide = this.createFeaturedSlide(project);
        sliderContainer.appendChild(slide);
      }
    });
  }
  
  createFeaturedSlide(project) {
    const slide = document.createElement('div');
    slide.className = 'item';
    
    slide.innerHTML = `
      <div class="featured-project-card">
        <div class="featured-image">
          <img src="${project.image}" alt="${project.title}" loading="lazy">
        </div>
        <div class="featured-content">
          <h3>${project.title}</h3>
          <p>${project.description.substring(0, 100)}...</p>
          <span class="featured-badge">
            ${project.badge || (document.documentElement.lang === 'ar' ? 'مميز' : 'Featured')}
          </span>
        </div>
      </div>
    `;
    
    return slide;
  }
  
  initOwlCarousel() {
    const $slider = $(this.elements.featuredSlider);
    const isRTL = this.config.isRTL;
    
    $slider.owlCarousel({
      loop: true,
      margin: 16,
      rtl: isRTL,
      center: true,
      nav: true,
      dots: true,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsive: {
        0: {
          items: 1,
          center: false
        },
        600: {
          items: 2
        },
        768: {
          items: 2,
          center: true
        },
        992: {
          items: 3
        },
        1200: {
          items: 4
        }
      },
      navText: [
        '<i class="fas fa-chevron-right"></i>',
        '<i class="fas fa-chevron-left"></i>'
      ],
      onInitialized: () => {
        this.dispatchEvent('slider:initialized');
      },
      onChanged: (event) => {
        this.dispatchEvent('slider:changed', { currentItem: event.item.index });
      }
    });
    
    // تحديث الاتجاه عند تغيير اللغة
    document.addEventListener('language:changed', () => {
      setTimeout(() => {
        $slider.trigger('destroy.owl.carousel');
        this.config.isRTL = document.documentElement.dir === 'rtl';
        this.initOwlCarousel();
      }, 300);
    });
  }
  
  // ============================================
  // RENDERING & STATE MANAGEMENT
  // ============================================
  
  renderProjects() {
    if (!this.elements.grid) return;
    
    // إخفاء جميع المشاريع أولاً
    this.projects.forEach(project => {
      project.element.style.display = 'none';
      project.element.classList.remove('visible');
    });
    
    // حساب العناصر المراد عرضها
    const itemsToShow = this.config.currentPage * this.config.itemsPerPage;
    const projectsToShow = this.filteredProjects.slice(0, itemsToShow);
    
    // عرض المشاريع المصفاة
    projectsToShow.forEach(project => {
      project.element.style.display = 'flex';
      
      // إضافة تأثير الظهور المتدرج
      setTimeout(() => {
        project.element.classList.add('visible');
      }, 50);
    });
    
    // التحقق إذا لم توجد مشاريع
    this.checkEmptyState();
  }
  
  checkEmptyState() {
    if (!this.elements.noProjectsMessage) return;
    
    if (this.filteredProjects.length === 0) {
      this.elements.noProjectsMessage.style.display = 'block';
      if (this.elements.grid) this.elements.grid.style.display = 'none';
    } else {
      this.elements.noProjectsMessage.style.display = 'none';
      if (this.elements.grid) this.elements.grid.style.display = 'grid';
    }
  }
  
  createLoadingIndicator() {
    // إنشاء مؤشر تحميل إذا لم يكن موجوداً
    if (!document.querySelector('.loading-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'loading-indicator';
      indicator.style.display = 'none';
      indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>
          <span class="ar">جاري تحميل المشاريع...</span>
          <span class="en hidden">Loading projects...</span>
        </p>
      `;
      
      // إدراجه بعد شبكة المشاريع
      if (this.elements.grid) {
        this.elements.grid.parentNode.insertBefore(indicator, this.elements.grid.nextSibling);
        this.elements.loadingIndicator = indicator;
      }
    } else {
      this.elements.loadingIndicator = document.querySelector('.loading-indicator');
    }
  }
  
  showLoading(show) {
    if (!this.elements.loadingIndicator) return;
    
    if (show) {
      this.elements.loadingIndicator.style.display = 'block';
      if (this.elements.loadMoreBtn) {
        this.elements.loadMoreBtn.disabled = true;
      }
    } else {
      this.elements.loadingIndicator.style.display = 'none';
      this.updateLoadMoreButton();
    }
  }
  
  updateProjectsCounter() {
    if (!this.elements.projectsCount) return;
    
    const total = this.projects.length;
    const filtered = this.filteredProjects.length;
    const showing = Math.min(
      this.config.currentPage * this.config.itemsPerPage,
      filtered
    );
    
    const isArabic = document.documentElement.lang === 'ar';
    
    this.elements.projectsCount.innerHTML = `
      <span class="ar" ${!isArabic ? 'style="display:none"' : ''}>
        عرض <strong>${showing}</strong> من <strong>${filtered}</strong> مشروع
        ${filtered !== total ? `(مصفى من ${total})` : ''}
      </span>
      <span class="en" ${isArabic ? 'style="display:none"' : ''}>
        Showing <strong>${showing}</strong> of <strong>${filtered}</strong> projects
        ${filtered !== total ? `(filtered from ${total})` : ''}
      </span>
    `;
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, system: this }
    });
    document.dispatchEvent(event);
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  getCurrentFilter() {
    return this.config.filter;
  }
  
  getTotalProjects() {
    return this.projects.length;
  }
  
  getFilteredProjects() {
    return this.filteredProjects.length;
  }
  
  filterByCategory(category) {
    const button = Array.from(this.elements.filterButtons)
      .find(btn => btn.dataset.filter === category);
    
    if (button) {
      button.click();
    }
  }
  
  resetFilter() {
    this.filterByCategory('all');
  }
  
  addProject(projectData) {
    // إنشاء عنصر مشروع جديد
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card-enhanced fade-in';
    projectCard.dataset.category = projectData.category || 'all';
    projectCard.dataset.featured = projectData.isFeatured || false;
    
    projectCard.innerHTML = `
      <div class="project-image-container">
        <img src="${projectData.image || 'https://via.placeholder.com/800x600/11224E/FFFFFF?text=Project'}" 
             alt="${projectData.title}" 
             class="project-image"
             loading="lazy">
        <span class="project-badge">
          ${projectData.badge || (document.documentElement.lang === 'ar' ? 'جديد' : 'New')}
        </span>
      </div>
      
      <div class="project-content">
        <h3 class="project-title">${projectData.title}</h3>
        <p class="project-description">${projectData.description}</p>
        <div class="project-meta">
          <div class="project-date">
            <i class="far fa-calendar"></i>
            <span>${projectData.date || new Date().getFullYear()}</span>
          </div>
          <a href="#contact" class="project-link">
            <span class="ar">استفسر عن المشروع</span>
            <span class="en hidden">Inquire About Project</span>
            <i class="fas fa-arrow-left"></i>
          </a>
        </div>
      </div>
    `;
    
    // إضافة إلى الـ DOM
    this.elements.grid.appendChild(projectCard);
    
    // إعادة استخراج المشاريع
    this.extractProjectsFromDOM();
    
    // تطبيق الفلتر الحالي
    this.applyFilter();
    
    // إرسال حدث الإضافة
    this.dispatchEvent('project:added', { project: projectData });
    
    return projectCard;
  }
  
  refresh() {
    // إعادة استخراج المشاريع من DOM
    this.extractProjectsFromDOM();
    
    // إعادة تطبيق الفلتر الحالي
    this.applyFilter();
    
    // تحديث العداد
    this.updateProjectsCounter();
    
    // تحديث الكاروسيل
    this.createFeaturedSliderContent();
    if (window.jQuery && $.fn.owlCarousel && this.elements.featuredSlider) {
      $(this.elements.featuredSlider).trigger('destroy.owl.carousel');
      this.initOwlCarousel();
    }
  }
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

function initProjectsSystem() {
  const projectsSection = document.getElementById('projects');
  if (!projectsSection) {
    console.warn('ProjectsSystem: لم يتم العثور على قسم المشاريع');
    return;
  }
  
  // التحقق إذا تم التهيئة مسبقاً
  if (projectsSection._projectsSystem) {
    console.log('ProjectsSystem: النظام مسبق التهيئة');
    return projectsSection._projectsSystem;
  }
  
  // إنشاء النظام
  const projectsSystem = new ProjectsSystem();
  
  // حفظ المرجع للوصول العام
  projectsSection._projectsSystem = projectsSystem;
  window.SummitProjects = projectsSystem;
  
  // إرسال حدث التهيئة
  document.dispatchEvent(new CustomEvent('projects:ready', {
    detail: { system: projectsSystem }
  }));
  
  return projectsSystem;
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

function optimizeProjectsPerformance() {
  // Lazy loading للصور
  const projectImages = document.querySelectorAll('.project-image[data-src]');
  
  if ('IntersectionObserver' in window && projectImages.length > 0) {
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
    
    projectImages.forEach(img => observer.observe(img));
  }
  
  // will-change للتحسينات
  const interactiveElements = document.querySelectorAll('.project-card-enhanced, .filter-btn, .featured-project-card');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.willChange = 'transform, opacity, box-shadow';
    });
    
    el.addEventListener('mouseleave', () => {
      setTimeout(() => {
        el.style.willChange = 'auto';
      }, 300);
    });
  });
  
  // Debounce لأحداث التمرير
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      // إضافة تأثيرات الظهور أثناء التمرير
      const elements = document.querySelectorAll('.project-card-enhanced:not(.visible)');
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          setTimeout(() => {
            el.classList.add('visible');
          }, index * 50);
        }
      });
    }, 100);
  });
  
  // التحسين لأجهزة اللمس
  if ('ontouchstart' in window) {
    document.querySelectorAll('.project-card-enhanced, .featured-project-card').forEach(el => {
      el.style.cursor = 'pointer';
    });
  }
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

function enhanceProjectsAccessibility() {
  // احترام تفضيلات الحركة المخفّضة
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const transitions = document.querySelectorAll('.project-card-enhanced, .featured-project-card, .filter-btn');
    transitions.forEach(el => {
      el.style.transition = 'none';
    });
    
    // إيقاف الرسوم المتحركة
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.animation = 'none';
    }
  }
  
  // التنقل بلوحة المفاتيح
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach((button, index) => {
    button.setAttribute('tabindex', '0');
    
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
      
      // التنقل بين الأزرار باستخدام الأسهم
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextButton = filterButtons[(index + 1) % filterButtons.length];
        nextButton.focus();
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevButton = filterButtons[(index - 1 + filterButtons.length) % filterButtons.length];
        prevButton.focus();
      }
    });
  });
  
  // ARIA labels للكاروسيل
  const slider = document.querySelector('.owl-carousel');
  if (slider) {
    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-label', 'المشاريع المميزة');
    
    // تحديث ARIA للغة الإنجليزية
    document.addEventListener('language:changed', () => {
      const isArabic = document.documentElement.lang === 'ar';
      slider.setAttribute('aria-label', isArabic ? 'المشاريع المميزة' : 'Featured Projects');
    });
  }
  
  // تحسين ARIA للمشاريع
  document.querySelectorAll('.project-card-enhanced').forEach((card, index) => {
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', `project-title-${index}`);
    
    const title = card.querySelector('.project-title');
    if (title) {
      title.id = `project-title-${index}`;
    }
  });
}

// ============================================
// EVENT HANDLERS FOR LANGUAGE CHANGES
// ============================================

function handleLanguageChangeForProjects() {
  document.addEventListener('language:changed', () => {
    // تحديث أزرار التحكم
    const loadMoreBtn = document.getElementById('loadMoreProjects');
    const viewAllBtn = document.getElementById('viewAllProjects');
    
    if (loadMoreBtn && window.SummitProjects) {
      window.SummitProjects.updateLoadMoreButton();
    }
    
    if (viewAllBtn) {
      const isArabic = document.documentElement.lang === 'ar';
      viewAllBtn.querySelector('.ar').style.display = isArabic ? 'inline' : 'none';
      viewAllBtn.querySelector('.en').style.display = isArabic ? 'none' : 'inline';
    }
    
    // تحديث العداد
    if (window.SummitProjects) {
      setTimeout(() => {
        window.SummitProjects.updateProjectsCounter();
      }, 100);
    }
  });
}

// ============================================
// EXPORT FOR MODULAR USE
// ============================================

const ProjectsSystemModule = {
  init: initProjectsSystem,
  optimize: optimizeProjectsPerformance,
  enhanceAccessibility: enhanceProjectsAccessibility,
  handleLanguageChange: handleLanguageChangeForProjects,
  ProjectsSystem: ProjectsSystem
};

// للاستخدام العام
window.SummitProjectsSystem = ProjectsSystemModule;

// ============================================
// AUTO-INITIALIZATION
// ============================================

// التهيئة التلقائية عند تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProjectsSystem);
} else {
  initializeProjectsSystem();
}

function initializeProjectsSystem() {
  // الانتظار حتى يتم تحميل DOM بالكامل
  setTimeout(() => {
    // تهيئة النظام الأساسي
    initProjectsSystem();
    
    // تحسينات الأداء
    optimizeProjectsPerformance();
    
    // تحسينات الوصولية
    enhanceProjectsAccessibility();
    
    // معالجة تغييرات اللغة
    handleLanguageChangeForProjects();
  }, 500);
}

// التهيئة عند تحميل كل شيء
window.addEventListener('load', () => {
  // تحسينات إضافية بعد تحميل كل شيء
  if (window.SummitProjects) {
    // إضافة تأثيرات الظهور الأولية
    document.querySelectorAll('.project-card-enhanced').forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setTimeout(() => {
          el.classList.add('visible');
        }, index * 100);
      }
    });
    
    // تحديث العداد
    window.SummitProjects.updateProjectsCounter();
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// معالجة الأخطاء بشكل عام
window.addEventListener('error', (e) => {
  console.error('حدث خطأ في نظام المشاريع:', e.error);
});

// معالجة الأخطاء غير الملتقطة
window.addEventListener('unhandledrejection', (e) => {
  console.error('رفض غير معالج في نظام المشاريع:', e.reason);
});

// ============================================
// API USAGE EXAMPLES
// ============================================

/*
// أمثلة لاستخدام API من الكونسول:

// 1. الوصول للنظام
window.SummitProjects.filterByCategory('construction');

// 2. إعادة تعيين الفلتر
window.SummitProjects.resetFilter();

// 3. الحصول على إحصائيات
window.SummitProjects.getTotalProjects();
window.SummitProjects.getFilteredProjects();

// 4. إضافة مشروع جديد ديناميكي
window.SummitProjects.addProject({
  title: 'مشروع جديد',
  description: 'وصف المشروع الجديد',
  category: 'construction',
  image: 'https://example.com/image.jpg',
  date: '2024',
  isFeatured: true,
  badge: 'جديد'
});

// 5. تحديث النظام
window.SummitProjects.refresh();
*/