// main.js — نسخة مصححة ومجتمعة

$(document).ready(function () {
  // فلترة العناصر (إذا موجودة عناصر .lists و .itembox)
  $(".lists").click(function () {
    const value = $(this).attr("data-filter");
    if (value == "All") {
      $(".itembox").show("1000");
    } else {
      $(".itembox").not("." + value).hide("1000");
      $(".itembox").filter("." + value).show("1000");
    }
    $(this).addClass("active").siblings().removeClass("active");
  });

  // تهيئة الكاروسيل (دعم RTL/LTR)
  function initProjectsCarousel() {
    const isRTL = $("html").attr("dir") === "rtl";

    try { $(".select").trigger("destroy.owl.carousel"); } catch (e) { /* ignore if not init */ }

    $(".select").owlCarousel({
      loop: true,
      margin: 16,
      rtl: isRTL,
      center: true, // مهم: false لتفادي الفراغات
      items: 1,
      responsive: {
        0:   { items: 1 },
        480: { items: 1 },
        768: { items: 2 },
        1025:{ items: 3 },
        1200:{ items: 4 }
      }
    });
  }

  initProjectsCarousel();

  // إعادة تهيئة بعد تبديل اللغة
  $("#langToggle").on("click", function () {
    // انتبه: زر اللغة في HTML يغيّر dir وlang بالفعل،
    // لذا نعيد تهيئة الكاروسيل بعد مهلة قصيرة.
    setTimeout(initProjectsCarousel, 350);
  });
});

// تفعيل علامة الرابط النشط (active) — آمن الاستخدام
const currentLocation = location.href;
document.querySelectorAll("a").forEach((a) => {
  try {
    if (a.href === currentLocation) a.classList.add("active");
  } catch (e) {}
});

// Dark mode detection
if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (event.matches) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
});

// Language toggle — (يغيّر عناصر .ar و .en و dir)
const langToggle = document.getElementById("langToggle");
if (langToggle) {
  const html = document.documentElement;
  langToggle.addEventListener("click", () => {
    if (html.classList.contains("en")) {
      html.classList.remove("en");
      html.setAttribute("lang", "ar");
      html.setAttribute("dir", "rtl");
      document.querySelectorAll(".ar").forEach(el => el.classList.remove("hidden"));
      document.querySelectorAll(".en").forEach(el => el.classList.add("hidden"));
    } else {
      html.classList.add("en");
      html.setAttribute("lang", "en");
      html.setAttribute("dir", "ltr");
      document.querySelectorAll(".en").forEach(el => el.classList.remove("hidden"));
      document.querySelectorAll(".ar").forEach(el => el.classList.add("hidden"));
    }
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    // if link points to same page target
    const href = this.getAttribute("href");
    if (href && href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// Intersection Observer for animations
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("active"); });
}, observerOptions);
document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right").forEach(el => observer.observe(el));

// Mobile menu toggle — استخدم الـ #mobileNav الموجود في HTML (لا تنشئ عنصر جديد)
// ✅ فتح وإغلاق القائمة بنفس الزر
const mobileMenuBtn = document.getElementById("mobileMenu");
const mobileNav = document.getElementById("mobileNav");

if (mobileMenuBtn && mobileNav) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileNav.classList.toggle("show");
    
    // تبديل الأيقونة (من bars إلى x)
    const icon = mobileMenuBtn.querySelector("i, svg");
    if (mobileNav.classList.contains("show")) {
     icon?.classList.remove("fa-bars");
      icon?.classList.add("fa-times");
    } else {
      icon?.classList.remove("fa-times");
      icon?.classList.add("fa-bars");
    }
  });
}
// ✅ إخفاء القائمة عند الضغط على أي رابط بداخلها
document.querySelectorAll("#mobileNav a").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("show");
    const icon = mobileMenuBtn.querySelector("i, svg");
    // رجع الأيقونة إلى ☰
    icon?.classList.remove("fa-times");
    icon?.classList.add("fa-bars");
  });
});
// ✅ إخفاء قائمة الموبايل عند تدوير الجهاز (من portrait إلى landscape أو العكس)
window.addEventListener("orientationchange", () => {
  if (mobileNav && mobileNav.classList.contains("show")) {
    mobileNav.classList.remove("show");

    // رجع الأيقونة إلى ☰ بدل ✕
    const icon = mobileMenuBtn?.querySelector("i, svg");
    icon?.classList.remove("fa-times");
    icon?.classList.add("fa-bars");
  }
});



// Loading animation for hero
window.addEventListener("load", () => {
  document.querySelectorAll(".fade-in").forEach((el, index) => {
    setTimeout(() => el.classList.add("active"), index * 150);
  });
});

// دمج مراقبة التمرير (header/nav) مع ظل سلس
let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const header = document.querySelector("header") || document.querySelector("nav");
  const navbar = document.querySelector("nav");
  const scrollY = window.scrollY || window.pageYOffset;

  if (!navbar) return;

  // --- تأثير الـ sticky والظل ---
  if (header) header.classList.toggle("sticky", scrollY > 0);

  if (scrollY > 100) {
    navbar.classList.add("bg-white/98", "shadow-md");
  } else {
    navbar.classList.remove("bg-white/98", "shadow-md");
  }

  // --- إظهار/إخفاء الـ navbar عند التمرير ---
  if (scrollY > lastScrollTop && scrollY > 100) {
    // المستخدم بينزل لتحت ⇒ اخفي البار
    navbar.classList.remove("nav-visible");
    navbar.classList.add("nav-hidden");
  } else {
    // المستخدم بيطلع لفوق ⇒ أظهر البار
    navbar.classList.remove("nav-hidden");
    navbar.classList.add("nav-visible");
  }

  lastScrollTop = scrollY;
});

