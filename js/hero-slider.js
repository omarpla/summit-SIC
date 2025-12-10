/**
 * HERO SLIDER SYSTEM - شركة سومت العالمية
 * File: hero-slider.js
 * Version: 3.0.0
 * Description: نظام متقدم للتحكم في سلايدر الهيرو مع تكامل كامل لنظام CSS
 */

// ============================================
// تعاريف المتغيرات الأساسية
// ============================================
const HeroSlider = (function() {
    'use strict';

    // ============================================
    // الإعدادات الافتراضية
    // ============================================
    const defaults = {
        autoPlay: true,
        autoPlayDelay: 7000,
        transitionDuration: 500,
        loop: true,
        touchEnabled: true,
        keyboardEnabled: true,
        lazyLoad: true,
        preloadNext: true,
        pauseOnHover: true,
        progressBar: true,
        animationType: 'fade'
    };

    // ============================================
    // فئة HeroSlider الرئيسية
    // ============================================
    class HeroSlider {
        constructor(element, options = {}) {
            // ============================================
            // تهيئة المتغيرات
            // ============================================
            this.config = { ...defaults, ...options };
            this.slider = element;
            this.container = this.slider.querySelector('.carousel-container');
            this.slides = Array.from(this.slider.querySelectorAll('.carousel-slide'));
            this.indicators = Array.from(this.slider.querySelectorAll('.indicator-btn'));
            this.prevBtn = this.slider.querySelector('.prev-btn');
            this.nextBtn = this.slider.querySelector('.next-btn');
            this.progressBar = this.slider.querySelector('.progress-bar');
            
            // ============================================
            // إدارة الحالة
            // ============================================
            this.currentIndex = 0;
            this.totalSlides = this.slides.length;
            this.isAnimating = false;
            this.autoPlayInterval = null;
            this.touchStartX = 0;
            this.touchEndX = 0;
            this.touchStartY = 0;
            this.touchEndY = 0;
            this.isPaused = false;
            this.progressInterval = null;
            this.progressWidth = 0;
            
            // ============================================
            // التحقق من وجود العناصر
            // ============================================
            if (!this.slides.length) {
                console.warn('Hero Slider: No slides found');
                return;
            }

            // ============================================
            // التهيئة
            // ============================================
            this.init();
        }

        // ============================================
        // طرق التهيئة
        // ============================================
        init() {
            try {
                // 1. إعداد الشريحة النشطة الأولى
                this.showSlide(this.currentIndex, true);
                
                // 2. ربط الأحداث
                this.bindEvents();
                
                // 3. بدء التشغيل التلقائي
                if (this.config.autoPlay) {
                    this.startAutoPlay();
                }
                
                // 4. تحميل الصور المؤجل
                if (this.config.lazyLoad) {
                    this.lazyLoadImages();
                }
                
                // 5. تحديث اتجاه الأسهم لـ RTL
                this.updateChevronDirection();
                
                // 6. إرسال حدث التهيئة
                this.dispatchEvent('slider:initialized', {
                    totalSlides: this.totalSlides,
                    config: this.config
                });
                
                console.log('Hero Slider: Initialized successfully');
            } catch (error) {
                console.error('Hero Slider: Initialization error', error);
            }
        }

        // ============================================
        // عرض الشريحة
        // ============================================
        showSlide(index, initial = false) {
            // التحقق من صحة الفهرس
            if (this.isAnimating || index < 0 || index >= this.totalSlides) {
                return;
            }

            this.isAnimating = true;

            // إخفاء الشريحة الحالية
            this.slides[this.currentIndex].classList.remove('active');
            this.slides[this.currentIndex].setAttribute('aria-hidden', 'true');
            
            if (this.indicators[this.currentIndex]) {
                this.indicators[this.currentIndex].classList.remove('active');
                this.indicators[this.currentIndex].setAttribute('aria-selected', 'false');
            }

            // تحديث الفهرس الحالي
            this.currentIndex = index;

            // إظهار الشريحة الجديدة
            this.slides[this.currentIndex].classList.add('active');
            this.slides[this.currentIndex].setAttribute('aria-hidden', 'false');
            
            if (this.indicators[this.currentIndex]) {
                this.indicators[this.currentIndex].classList.add('active');
                this.indicators[this.currentIndex].setAttribute('aria-selected', 'true');
            }

            // إدارة شريط التقدم
            if (this.config.progressBar && this.progressBar) {
                this.resetProgressBar();
            }

            // تشغيل عدادات الإحصائيات (في الشريحة الأولى فقط)
            if (this.currentIndex === 0) {
                this.animateCounters();
            }

            // تحميل الصور مسبقاً للشريحة التالية
            if (this.config.preloadNext) {
                this.preloadNextSlide();
            }

            // إرسال حدث تغيير الشريحة
            this.dispatchEvent('slide:change', {
                currentIndex: this.currentIndex,
                previousIndex: initial ? null : (index - 1 + this.totalSlides) % this.totalSlides,
                totalSlides: this.totalSlides
            });

            // إعادة تعيين حالة التحريك
            setTimeout(() => {
                this.isAnimating = false;
            }, this.config.transitionDuration);
        }

        // ============================================
        // الشريحة التالية
        // ============================================
        nextSlide() {
            if (this.config.loop) {
                const nextIndex = (this.currentIndex + 1) % this.totalSlides;
                this.showSlide(nextIndex);
            } else if (this.currentIndex < this.totalSlides - 1) {
                this.showSlide(this.currentIndex + 1);
            }
            
            if (this.config.autoPlay) {
                this.resetAutoPlay();
            }
        }

        // ============================================
        // الشريحة السابقة
        // ============================================
        prevSlide() {
            if (this.config.loop) {
                const prevIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
                this.showSlide(prevIndex);
            } else if (this.currentIndex > 0) {
                this.showSlide(this.currentIndex - 1);
            }
            
            if (this.config.autoPlay) {
                this.resetAutoPlay();
            }
        }

        // ============================================
        // الذهاب إلى شريحة محددة
        // ============================================
        goToSlide(index) {
            if (index >= 0 && index < this.totalSlides) {
                this.showSlide(index);
                if (this.config.autoPlay) {
                    this.resetAutoPlay();
                }
            }
        }

        // ============================================
        // التحكم في التشغيل التلقائي
        // ============================================
        startAutoPlay() {
            if (this.autoPlayInterval || !this.config.autoPlay || this.isPaused) {
                return;
            }

            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, this.config.autoPlayDelay);

            // بدء شريط التقدم
            if (this.config.progressBar && this.progressBar) {
                this.startProgressBar();
            }

            this.dispatchEvent('autoplay:start');
        }

        stopAutoPlay() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
                
                // إيقاف شريط التقدم
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                }
                
                this.dispatchEvent('autoplay:stop');
            }
        }

        resetAutoPlay() {
            this.stopAutoPlay();
            if (this.config.autoPlay && !this.isPaused) {
                this.startAutoPlay();
            }
        }

        pause() {
            this.isPaused = true;
            this.stopAutoPlay();
            this.dispatchEvent('slider:pause');
        }

        resume() {
            this.isPaused = false;
            if (this.config.autoPlay) {
                this.startAutoPlay();
            }
            this.dispatchEvent('slider:resume');
        }

        // ============================================
        // إدارة شريط التقدم
        // ============================================
        startProgressBar() {
            if (!this.progressBar) return;
            
            this.progressWidth = 0;
            this.progressBar.style.width = '0%';
            
            const step = 100 / (this.config.autoPlayDelay / 10);
            
            this.progressInterval = setInterval(() => {
                this.progressWidth += step;
                if (this.progressWidth >= 100) {
                    this.progressWidth = 100;
                    clearInterval(this.progressInterval);
                }
                this.progressBar.style.width = `${this.progressWidth}%`;
            }, 10);
        }

        resetProgressBar() {
            if (!this.progressBar) return;
            
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
            
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = '0%';
            
            setTimeout(() => {
                this.progressBar.style.transition = `width ${this.config.autoPlayDelay}ms linear`;
                if (this.config.autoPlay && !this.isPaused) {
                    this.startProgressBar();
                }
            }, 10);
        }

        // ============================================
        // الرسوم المتحركة للعدادات
        // ============================================
        animateCounters() {
            const counters = this.slider.querySelectorAll('.stat-number');
            if (!counters.length) return;
            
            const animationDelay = 100; // تأخير بين العدادات
            
            counters.forEach((counter, index) => {
                setTimeout(() => {
                    const target = parseInt(counter.getAttribute('data-count'), 10);
                    if (isNaN(target)) return;
                    
                    const duration = 1500;
                    const steps = 60;
                    const stepValue = target / steps;
                    let current = 0;
                    let step = 0;
                    
                    const counterTimer = setInterval(() => {
                        current += stepValue;
                        step++;
                        
                        if (step >= steps) {
                            counter.textContent = target;
                            clearInterval(counterTimer);
                            
                            // إضافة تأثير عند الانتهاء
                            counter.classList.add('animated');
                            setTimeout(() => {
                                counter.classList.remove('animated');
                            }, 300);
                        } else {
                            counter.textContent = Math.floor(current);
                        }
                    }, duration / steps);
                }, index * animationDelay);
            });
        }

        // ============================================
        // تحسينات الأداء
        // ============================================
        lazyLoadImages() {
            const images = this.slider.querySelectorAll('img[data-src]');
            if (!images.length) return;
            
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            if (img.dataset.srcset) {
                                img.srcset = img.dataset.srcset;
                            }
                            img.removeAttribute('data-src');
                            img.removeAttribute('data-srcset');
                            imageObserver.unobserve(img);
                            
                            // إضافة فئة عند التحميل
                            img.addEventListener('load', () => {
                                img.classList.add('loaded');
                            });
                        }
                    });
                }, {
                    rootMargin: '50px 0px',
                    threshold: 0.1
                });
                
                images.forEach(img => imageObserver.observe(img));
            } else {
                // دعم المتصفحات القديمة
                images.forEach(img => {
                    img.src = img.dataset.src;
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }
                    img.removeAttribute('data-src');
                    img.removeAttribute('data-srcset');
                });
            }
        }

        preloadNextSlide() {
            const nextIndex = (this.currentIndex + 1) % this.totalSlides;
            const nextSlide = this.slides[nextIndex];
            
            // تحميل خلفية الشريحة التالية مسبقاً
            const bgImage = nextSlide.style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const imageUrl = bgImage.match(/url\(["']?([^"']+)["']?\)/);
                if (imageUrl && imageUrl[1]) {
                    const img = new Image();
                    img.src = imageUrl[1];
                }
            }
            
            // تحميل الصور داخل الشريحة التالية
            const images = nextSlide.querySelectorAll('img[data-src]');
            images.forEach(img => {
                if (img.dataset.src) {
                    const preloadImg = new Image();
                    preloadImg.src = img.dataset.src;
                }
            });
        }

        // ============================================
        // ربط الأحداث
        // ============================================
        bindEvents() {
            // أحداث أزرار المؤشرات
            this.indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.goToSlide(index);
                });
                
                // تحسين الوصولية
                indicator.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.goToSlide(index);
                    }
                });
            });
            
            // أحداث أزرار التنقل
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.prevSlide();
                });
                
                this.prevBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.prevSlide();
                    }
                });
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.nextSlide();
                });
                
                this.nextBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.nextSlide();
                    }
                });
            }
            
            // التنقل بلوحة المفاتيح
            if (this.config.keyboardEnabled) {
                document.addEventListener('keydown', (e) => {
                    // التأكد من أن السلايدر مرئي
                    const sliderRect = this.slider.getBoundingClientRect();
                    const isSliderVisible = (
                        sliderRect.top >= 0 &&
                        sliderRect.left >= 0 &&
                        sliderRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        sliderRect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                    
                    if (!isSliderVisible) return;
                    
                    switch (e.key) {
                        case 'ArrowLeft':
                            e.preventDefault();
                            this.prevSlide();
                            break;
                        case 'ArrowRight':
                            e.preventDefault();
                            this.nextSlide();
                            break;
                        case 'Home':
                            e.preventDefault();
                            this.goToSlide(0);
                            break;
                        case 'End':
                            e.preventDefault();
                            this.goToSlide(this.totalSlides - 1);
                            break;
                        case ' ':
                        case 'Spacebar':
                            e.preventDefault();
                            if (this.config.autoPlay) {
                                if (this.isPaused) {
                                    this.resume();
                                } else {
                                    this.pause();
                                }
                            }
                            break;
                    }
                });
            }
            
            // دعم اللمس والسحب
            if (this.config.touchEnabled && 'ontouchstart' in window) {
                let touchStartTime = 0;
                let isScrolling = false;
                
                this.slider.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    this.touchStartX = e.changedTouches[0].screenX;
                    this.touchStartY = e.changedTouches[0].screenY;
                    isScrolling = false;
                    
                    // إيقاف التشغيل التلقائي مؤقتاً
                    if (this.config.autoPlay) {
                        this.stopAutoPlay();
                    }
                }, { passive: true });
                
                this.slider.addEventListener('touchmove', (e) => {
                    const touchY = e.changedTouches[0].screenY;
                    const diffY = Math.abs(touchY - this.touchStartY);
                    
                    // تحديد إذا كان المستخدم يقوم بالتمرير عمودياً
                    if (diffY > 10) {
                        isScrolling = true;
                    }
                }, { passive: true });
                
                this.slider.addEventListener('touchend', (e) => {
                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTime;
                    
                    if (touchDuration < 500 && !isScrolling) {
                        this.touchEndX = e.changedTouches[0].screenX;
                        this.handleSwipe();
                    }
                    
                    // استئناف التشغيل التلقائي
                    if (this.config.autoPlay && !this.isPaused) {
                        setTimeout(() => {
                            this.startAutoPlay();
                        }, 1000);
                    }
                }, { passive: true });
            }
            
            // دعم عجلة الماوس
            this.slider.addEventListener('wheel', (e) => {
                // التأكد من أن السلايدر هو الهدف
                if (e.target.closest('.hero-slider') !== this.slider) return;
                
                e.preventDefault();
                
                // استخدام deltaY للكشف عن اتجاه التمرير
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    if (e.deltaY > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
            }, { passive: false });
            
            // التوقف عند التحويم
            if (this.config.pauseOnHover) {
                this.slider.addEventListener('mouseenter', () => {
                    if (this.config.autoPlay) {
                        this.pause();
                    }
                });
                
                this.slider.addEventListener('mouseleave', () => {
                    if (this.config.autoPlay && !this.isPaused) {
                        this.resume();
                    }
                });
            }
            
            // إعادة ضبط عند تغيير حجم النافذة
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateChevronDirection();
                    this.dispatchEvent('slider:resize');
                }, 250);
            });
            
            // مراقبة الرؤية (Intersection Observer)
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // استئناف التشغيل عند ظهور السلايدر
                            if (this.config.autoPlay && !this.isPaused) {
                                this.resume();
                            }
                        } else {
                            // إيقاف التشغيل عند إخفاء السلايدر
                            if (this.config.autoPlay) {
                                this.pause();
                            }
                        }
                    });
                }, {
                    threshold: 0.5
                });
                
                observer.observe(this.slider);
            }
        }

        // ============================================
        // التعامل مع السحب
        // ============================================
        handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = this.touchStartX - this.touchEndX;
            
            // تحديد إذا كان السحب أفقيًا بدرجة كافية
            if (Math.abs(swipeDistance) > swipeThreshold) {
                if (swipeDistance > 0) {
                    // سحب لليمين - الشريحة التالية
                    this.nextSlide();
                } else {
                    // سحب لليسار - الشريحة السابقة
                    this.prevSlide();
                }
            }
        }

        // ============================================
        // تحديث اتجاه الأسهم لـ RTL/LTR
        // ============================================
        updateChevronDirection() {
            const html = document.documentElement;
            const isRTL = html.getAttribute('dir') === 'rtl' || 
                         html.getAttribute('lang') === 'ar';
            
            const prevIcons = this.slider.querySelectorAll('.prev-btn i');
            const nextIcons = this.slider.querySelectorAll('.next-btn i');
            
            prevIcons.forEach(icon => {
                if (isRTL) {
                    icon.classList.remove('fa-chevron-left');
                    icon.classList.add('fa-chevron-right');
                } else {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-left');
                }
            });
            
            nextIcons.forEach(icon => {
                if (isRTL) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-left');
                } else {
                    icon.classList.remove('fa-chevron-left');
                    icon.classList.add('fa-chevron-right');
                }
            });
        }

        // ============================================
        // إرسال الأحداث المخصصة
        // ============================================
        dispatchEvent(eventName, detail = {}) {
            const event = new CustomEvent(eventName, {
                detail: { ...detail, slider: this },
                bubbles: true
            });
            this.slider.dispatchEvent(event);
        }

        // ============================================
        // واجهة برمجة التطبيقات العامة
        // ============================================
        get currentSlide() {
            return this.slides[this.currentIndex];
        }

        get totalSlidesCount() {
            return this.totalSlides;
        }

        get isAutoPlaying() {
            return this.autoPlayInterval !== null;
        }

        destroy() {
            // إيقاف المؤقتات
            this.stopAutoPlay();
            
            // إزالة جميع مستمعي الأحداث
            const clone = this.slider.cloneNode(true);
            this.slider.parentNode.replaceChild(clone, this.slider);
            
            // إرسال حدث التدمير
            this.dispatchEvent('slider:destroy');
            
            console.log('Hero Slider: Destroyed');
        }
    }

    // ============================================
    // التهيئة العامة
    // ============================================
    function initHeroSlider() {
        const sliderElements = document.querySelectorAll('.hero-slider');
        
        if (!sliderElements.length) {
            console.warn('Hero Slider: No slider elements found');
            return [];
        }
        
        const sliders = [];
        
        sliderElements.forEach((element, index) => {
            // منع التهيئة المزدوجة
            if (element._sliderInstance) {
                console.warn(`Hero Slider: Element ${index} already initialized`);
                sliders.push(element._sliderInstance);
                return;
            }
            
            try {
                const slider = new HeroSlider(element);
                element._sliderInstance = slider;
                sliders.push(slider);
                
                console.log(`Hero Slider: Element ${index} initialized`);
            } catch (error) {
                console.error(`Hero Slider: Failed to initialize element ${index}`, error);
            }
        });
        
        return sliders;
    }

    // ============================================
    // تحسينات الأداء
    // ============================================
    function optimizeSliderPerformance() {
        // استخدام will-change للتحسين
        const slideElements = document.querySelectorAll('.carousel-slide');
        slideElements.forEach((slide, index) => {
            slide.style.willChange = index === 0 ? 'opacity, transform' : 'auto';
        });
        
        // تقليل عدد إعادة التصيير
        const container = document.querySelector('.carousel-container');
        if (container) {
            container.style.transform = 'translateZ(0)';
        }
    }

    // ============================================
    // تحسينات الوصولية
    // ============================================
    function enhanceSliderAccessibility() {
        // احترام تقليل الحركة
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const transitions = document.querySelectorAll('.carousel-slide, .progress-bar');
            transitions.forEach(el => {
                el.style.transition = 'none';
            });
            
            // إيقاف التشغيل التلقائي
            const autoPlayElements = document.querySelectorAll('.hero-slider');
            autoPlayElements.forEach(slider => {
                if (slider._sliderInstance) {
                    slider._sliderInstance.config.autoPlay = false;
                    slider._sliderInstance.stopAutoPlay();
                }
            });
        }
        
        // تحسين التركيز
        const slides = document.querySelectorAll('.carousel-slide[aria-hidden="false"]');
        slides.forEach(slide => {
            slide.setAttribute('tabindex', '0');
        });
        
        // إضافة تلميحات لوحة المفاتيح
        const keyboardInstructions = document.querySelector('.keyboard-instructions');
        if (keyboardInstructions) {
            keyboardInstructions.setAttribute('aria-live', 'polite');
        }
    }

    // ============================================
    // الواجهة العامة
    // ============================================
    return {
        init: initHeroSlider,
        optimize: optimizeSliderPerformance,
        enhanceAccessibility: enhanceSliderAccessibility,
        HeroSlider: HeroSlider,
        
        // دعم jQuery (اختياري)
        jQuery: function($) {
            if (!$) return;
            
            $.fn.heroSlider = function(options) {
                return this.each(function() {
                    if (!$(this).data('heroSlider')) {
                        const slider = new HeroSlider(this, options);
                        $(this).data('heroSlider', slider);
                    }
                });
            };
        }
    };
})();

// ============================================
// التصدير للاستخدام العام
// ============================================
window.SummitHeroSlider = HeroSlider;

// ============================================
// التهيئة التلقائية عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة السلايدر
    const sliders = HeroSlider.init();
    
    // تحسين الأداء
    HeroSlider.optimize();
    
    // تحسين الوصولية
    HeroSlider.enhanceAccessibility();
    
    // جعل السلايدر متاحاً عالمياً
    window.sliders = sliders;
    
    // دعم jQuery إذا كان موجوداً
    if (window.jQuery) {
        HeroSlider.jQuery(window.jQuery);
    }
    
    console.log('Hero Slider System: Ready');
});

// ============================================
// دعم واجهة الأحداث
// ============================================
document.addEventListener('slider:initialized', function(e) {
    console.log('Slider initialized:', e.detail);
});

document.addEventListener('slide:change', function(e) {
    console.log('Slide changed:', e.detail.currentIndex);
});
