/* home.js — meto.com.ar landing cinematográfica */
(function () {
  'use strict';

  // ────────────────────────────────────────────────────
  // Config
  // ────────────────────────────────────────────────────
  const SUPABASE_URL = 'https://sqiubgeanzowpgkaqcmz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXViZ2Vhbnpvd3Bna2FxY216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTQ5ODYsImV4cCI6MjA5MzA5MDk4Nn0.A7NCoRSsXoDtM4r5Ltx14_h1smUKO88V6Gz67RHnbeU';
  const BRAND = {
    violet: '#6B3AFF',
    coral: '#FF4D6D',
    paper: '#FAFAF7',
    ink:   '#0E0E14',
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNav();
    setupSmoothScroll();
    setupHeroCanvas();
    setupHeroTitleReveal();
    setupRevealObserver();
    setupStatCounter();
    setupProductScrub();
    setupWaitlist();
  }

  // ────────────────────────────────────────────────────
  // Nav behavior
  // ────────────────────────────────────────────────────
  function setupNav() {
    const nav = document.querySelector('.home-nav');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    document.querySelectorAll('[data-scroll-to]').forEach(el => {
      el.addEventListener('click', e => {
        const target = document.querySelector(el.getAttribute('data-scroll-to'));
        if (!target) return;
        e.preventDefault();
        scrollToEl(target);
      });
    });
  }

  function scrollToEl(el) {
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ────────────────────────────────────────────────────
  // Lenis smooth scroll
  // ────────────────────────────────────────────────────
  function setupSmoothScroll() {
    if (prefersReducedMotion) return;
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });
    window.__lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Wire with GSAP ScrollTrigger if present
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // ────────────────────────────────────────────────────
  // Hero canvas — grid de puntos + coral dot que viaja
  // ────────────────────────────────────────────────────
  function setupHeroCanvas() {
    if (prefersReducedMotion) return;
    const canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;
    let dots = [];
    const dotSpacing = 46;
    const coral = { x: 0, y: 0, tx: 0, ty: 0, radius: 8, trail: [] };
    const reduced = () => document.hidden;

    function resize() {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;
      // Offset half-cell so grid feels organic
      const ox = (width - (cols - 1) * dotSpacing) / 2;
      const oy = (height - (rows - 1) * dotSpacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: ox + i * dotSpacing,
            y: oy + j * dotSpacing,
            baseAlpha: 0.08 + Math.random() * 0.06,
            glow: 0,
          });
        }
      }

      coral.x = width / 2;
      coral.y = height / 2;
      pickNewTarget();
    }

    function pickNewTarget() {
      if (!dots.length) return;
      const idx = Math.floor(Math.random() * dots.length);
      coral.tx = dots[idx].x;
      coral.ty = dots[idx].y;
    }

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      if (!reduced()) {
        // Move coral toward target
        const dx = coral.tx - coral.x;
        const dy = coral.ty - coral.y;
        const dist = Math.hypot(dx, dy);
        const speed = 2.2; // radians-ish
        coral.x += dx * Math.min(1, dt * speed);
        coral.y += dy * Math.min(1, dt * speed);

        if (dist < 4) {
          pickNewTarget();
        }

        // Trail
        coral.trail.unshift({ x: coral.x, y: coral.y });
        if (coral.trail.length > 18) coral.trail.pop();

        // Glow nearby dots
        for (const d of dots) {
          const dd = Math.hypot(d.x - coral.x, d.y - coral.y);
          if (dd < 90) {
            d.glow = Math.max(d.glow, 1 - dd / 90);
          }
          d.glow = Math.max(0, d.glow - dt * 0.8);
        }
      }

      draw();
      requestAnimationFrame(tick);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Base dots
      for (const d of dots) {
        const a = d.baseAlpha + d.glow * 0.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.6 + d.glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 58, 255, ${a.toFixed(3)})`;
        ctx.fill();
      }

      // Coral trail
      for (let i = coral.trail.length - 1; i > 0; i--) {
        const p = coral.trail[i];
        const a = (1 - i / coral.trail.length) * 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, coral.radius * (1 - i / coral.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 77, 109, ${a.toFixed(3)})`;
        ctx.fill();
      }

      // Coral core with soft glow
      const grad = ctx.createRadialGradient(coral.x, coral.y, 0, coral.x, coral.y, coral.radius * 5);
      grad.addColorStop(0, 'rgba(255, 77, 109, 0.9)');
      grad.addColorStop(0.3, 'rgba(255, 77, 109, 0.35)');
      grad.addColorStop(1, 'rgba(255, 77, 109, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(coral.x, coral.y, coral.radius * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(coral.x, coral.y, coral.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FF4D6D';
      ctx.fill();
    }

    resize();
    window.addEventListener('resize', debounce(resize, 200));
    requestAnimationFrame(tick);
  }

  // ────────────────────────────────────────────────────
  // Hero title reveal (words slide up + stagger)
  // ────────────────────────────────────────────────────
  function setupHeroTitleReveal() {
    const words = document.querySelectorAll('.hero-title .hero-word');
    if (!words.length) return;
    if (prefersReducedMotion || !window.gsap) {
      words.forEach(w => { w.style.transform = 'translateY(0)'; });
      return;
    }
    gsap.from(words, {
      yPercent: 110,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.06,
    });
    // Hero sub + meta cascade
    gsap.from('.hero-eyebrow, .hero-sub, .hero-meta', {
      opacity: 0,
      y: 16,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.4,
    });
    gsap.from('.scroll-cue', {
      opacity: 0,
      y: 12,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1.3,
    });
  }

  // ────────────────────────────────────────────────────
  // IntersectionObserver reveals + in-view flags
  // ────────────────────────────────────────────────────
  function setupRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
      el.style.transitionDelay = (i % 5) * 80 + 'ms';
      io.observe(el);
    });

    // Section in-view toggles (for .lede-strike, etc.)
    const sections = document.querySelectorAll('section');
    const io2 = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-inview', entry.isIntersecting);
      }
    }, { threshold: 0.25 });
    sections.forEach(s => io2.observe(s));
  }

  // ────────────────────────────────────────────────────
  // Stat counter (data-counter=80 → 0 → 80 on reveal)
  // ────────────────────────────────────────────────────
  function setupStatCounter() {
    const el = document.querySelector('[data-counter]');
    if (!el) return;
    const target = parseInt(el.dataset.counter, 10);
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animateNumber(el, 0, target, 1200);
          io.unobserve(el);
        }
      }
    }, { threshold: 0.4 });
    io.observe(el);
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ────────────────────────────────────────────────────
  // Product scroll-scrub (cambia screen según progreso)
  // ────────────────────────────────────────────────────
  function setupProductScrub() {
    if (!window.ScrollTrigger || !window.gsap) return;

    const section = document.querySelector('.product');
    const images = section ? section.querySelectorAll('.phone-screen img') : [];
    const overlays = section ? section.querySelectorAll('.screen-overlay') : [];
    const captions = section ? section.querySelectorAll('.product-captions li') : [];
    if (!section || !images.length) return;

    const steps = Array.from(images).map(img => img.dataset.screen);

    let currentKey = null;
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        const key = steps[idx];
        if (key === currentKey) return;
        currentKey = key;
        images.forEach(img => img.classList.toggle('is-active', img.dataset.screen === key));
        captions.forEach(cap => cap.classList.toggle('is-active', cap.dataset.screen === key));
        overlays.forEach(ov => ov.classList.toggle('is-active', ov.dataset.overlay === key));
        onChapterChange(key);
      },
    });

    // Fade in phone when section enters
    gsap.from('.phone, .product-copy', {
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12,
    });
  }

  // Chapter changes: overlays carry their own CSS animations,
  // so we don't need to kick anything here. Kept as an extension point.
  function onChapterChange(_key) { /* no-op */ }

  // ────────────────────────────────────────────────────
  // Waitlist form + counter
  // ────────────────────────────────────────────────────
  function setupWaitlist() {
    if (typeof window.supabase === 'undefined') {
      console.warn('[meto] Supabase client no cargado — waitlist en modo degradado');
      return;
    }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    fetchCounter(client);

    const form = document.getElementById('waitlist-form');
    if (!form) return;

    const formRow = form.querySelector('.form-row');
    const emailInput = form.querySelector('#wl-email');
    const hoodInput = form.querySelector('#wl-hood');
    const submitBtn = form.querySelector('.waitlist-submit');
    const submitLabel = submitBtn.querySelector('.submit-label');
    const status = document.getElementById('form-status');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearState();

      const email = emailInput.value.trim().toLowerCase();
      if (!isValidEmail(email)) {
        setStatus('Ingresá un email válido (ej. nombre@dominio.com).', 'error');
        formRow.classList.add('is-invalid');
        emailInput.focus();
        return;
      }

      const hood = hoodInput.value.trim() || null;

      submitBtn.dataset.state = 'loading';
      submitLabel.textContent = 'Enviando...';

      try {
        const { error } = await client
          .from('waitlist')
          .insert({ email, neighborhood: hood, source: 'website', user_agent: navigator.userAgent.slice(0, 180) });

        if (error) {
          if (error.code === '23505') {
            // Email ya en la lista: tratamos como success amable
            showSuccess('Ya estabas en la lista. Te avisamos primero.');
          } else {
            console.error('[meto] waitlist error', error);
            setStatus('No pudimos sumar tu email ahora. Probá de nuevo en unos minutos.', 'error');
            submitBtn.dataset.state = '';
            submitLabel.textContent = 'Entrar a la lista';
          }
          return;
        }

        showSuccess('Entraste a la lista. Te avisamos en cuanto podamos arrancar en tu zona.');
        fetchCounter(client);
      } catch (err) {
        console.error('[meto] waitlist exception', err);
        setStatus('Hay un problema de conexión. Volvé a intentar.', 'error');
        submitBtn.dataset.state = '';
        submitLabel.textContent = 'Entrar a la lista';
      }
    });

    function clearState() {
      formRow.classList.remove('is-invalid', 'is-success');
      status.textContent = '';
      status.classList.remove('is-error', 'is-success');
    }

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.classList.remove('is-error', 'is-success');
      if (kind) status.classList.add('is-' + kind);
    }

    function showSuccess(msg) {
      submitBtn.dataset.state = 'success';
      submitLabel.textContent = '✓ Listo';
      formRow.classList.add('is-success');
      setStatus(msg, 'success');
      form.querySelectorAll('input').forEach(i => { i.disabled = true; });
    }
  }

  async function fetchCounter(client) {
    try {
      const { data, error } = await client
        .from('waitlist_count')
        .select('total')
        .single();
      if (error || !data) return;
      const el = document.getElementById('waitlist-counter');
      const num = el ? el.querySelector('.counter-num') : null;
      if (!el || !num) return;
      animateNumber(num, 0, data.total, 1000);
      el.classList.add('is-ready');
    } catch (err) {
      // silent
    }
  }

  // ────────────────────────────────────────────────────
  // Utilities
  // ────────────────────────────────────────────────────
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

})();
