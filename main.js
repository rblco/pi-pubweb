/* ============================================================
   RhizApp LLC – main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar scroll behavior ---- */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ---- Mobile nav toggle ---- */
  const toggle = document.querySelector('.navbar-toggle');
  const nav    = document.querySelector('.navbar-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Active nav link ---- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav a').forEach(link => {
    const linkPath = link.getAttribute('href').split('/').pop();
    if (linkPath === currentPath) link.classList.add('active');
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      // Open clicked if it was closed
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Scroll-triggered fade-up animations ---- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, entry.target.dataset.delay || 0);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ---- Stagger delay for grid children ---- */
  document.querySelectorAll('.stagger > *').forEach((el, i) => {
    el.dataset.delay = i * 80;
    el.classList.add('fade-up');
  });

  /* ---- Contact form submission ---- */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Message Sent ✓';
      btn.disabled = true;
      btn.style.background = '#2d8a4e';
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 4000);
    });
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---- Simple counter animation for stats ---- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const duration = 1500;
          const start = performance.now();
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObserver.observe(el));
  }
});
