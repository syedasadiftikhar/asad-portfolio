(function () {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const loaderEl = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const enterBtn = document.getElementById('enter-btn');
  const root = document.documentElement;

  let dpr = window.devicePixelRatio || 1;
  let logicalWidth = window.innerWidth;
  let logicalHeight = window.innerHeight;

  let particles = [];
  const config = {
    particleCount: 160,
    maxLinkDistance: 180,
    baseSpeed: 0.04,
    warpStrength: 3.5,
  };

  let hasStarted = false;
  let readyForEntry = false;

  function resizeCanvas() {
    logicalWidth = window.innerWidth;
    logicalHeight = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle() {
    const depth = Math.random();
    const speed = config.baseSpeed + depth * 0.3;
    return {
      x: (Math.random() - 0.5) * logicalWidth * 1.8,
      y: (Math.random() - 0.5) * logicalHeight * 1.8,
      z: 0.2 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(createParticle());
    }
  }

  function updateParticles() {
    for (let p of particles) {
      p.x += p.vx * config.warpStrength;
      p.y += p.vy * config.warpStrength;

      const limitX = logicalWidth * 1.2;
      const limitY = logicalHeight * 1.2;

      if (p.x < -limitX || p.x > limitX || p.y < -limitY || p.y > limitY) {
        Object.assign(p, createParticle());
      }
    }
  }

  function drawBackgroundGradient() {
    const gradient = ctx.createRadialGradient(
      logicalWidth * 0.2,
      logicalHeight * 0.2,
      0,
      logicalWidth * 0.2,
      logicalHeight * 0.2,
      logicalWidth * 0.9
    );
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.45)');
    gradient.addColorStop(0.4, 'rgba(15, 15, 20, 0.95)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const depthScale = 0.3 + p.z * 0.9;

      const px = logicalWidth / 2 + p.x * depthScale;
      const py = logicalHeight / 2 + p.y * depthScale;

      const radius = 1.1 + p.z * 2.4;

      const g = ctx.createRadialGradient(px, py, 0, px, py, radius * 3);
      g.addColorStop(0, 'rgba(255, 250, 245, 0.95)');
      g.addColorStop(0.45, 'rgba(255, 120, 60, 0.9)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const maxDistSq = config.maxLinkDistance * config.maxLinkDistance;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      const depth1 = 0.3 + p1.z * 0.9;
      const x1 = logicalWidth / 2 + p1.x * depth1;
      const y1 = logicalHeight / 2 + p1.y * depth1;

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const depth2 = 0.3 + p2.z * 0.9;
        const x2 = logicalWidth / 2 + p2.x * depth2;
        const y2 = logicalHeight / 2 + p2.y * depth2;

        const dx = x1 - x2;
        const dy = y1 - y2;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const alpha = 1 - distSq / maxDistSq;
          ctx.strokeStyle = `rgba(255, 120, 60, ${alpha * 0.5})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  function animateBackground() {
    updateParticles();
    drawBackgroundGradient();
    drawParticles();
    requestAnimationFrame(animateBackground);
  }

  function startBackground() {
    resizeCanvas();
    initParticles();
    animateBackground();
  }

  function updateLoaderVisual(percent) {
    loaderBar.style.width = percent + '%';
    loaderPercent.textContent = Math.round(percent) + '%';
  }

  function showEnter() {
    if (readyForEntry) return;
    readyForEntry = true;
    enterBtn.classList.remove('opacity-0', 'pointer-events-none');

    setTimeout(() => {
      if (!hasStarted) startExperience();
    }, 1200);
  }

  function runLoader() {
    const start = performance.now();
    const minDuration = 1200;
    const maxDuration = 2200;

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / minDuration, 1);
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      const percent = Math.min(100, eased * 100);
      updateLoaderVisual(percent);

      if (elapsed < maxDuration && percent < 100) {
        requestAnimationFrame(step);
      } else {
        updateLoaderVisual(100);
        showEnter();
      }
    }

    requestAnimationFrame(step);
  }

  function initScrollAnimation() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Reveal-up utility elements
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // Hero container subtle parallax / scale as you scroll out
    const heroInner = document.getElementById('hero-inner');
    if (heroInner) {
      gsap.to(heroInner, {
        scrollTrigger: {
          trigger: '#scroll-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        y: -80,
        opacity: 0.8,
        scale: 0.96,
        ease: 'none',
      });
    }

    // Section-level parallax to make scroll feel deeper
    gsap.utils.toArray('section[id]').forEach((section) => {
      if (section.id === 'scroll-hero') return;
      gsap.fromTo(
        section,
        { y: 40 },
        {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    // Subtle overlay shift as you scroll past hero
    const overlay = document.getElementById('hero-overlay');
    if (overlay) {
      gsap.to(overlay, {
        scrollTrigger: {
          trigger: '#scroll-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        opacity: 0.65,
        ease: 'none',
      });
    }
  }

  function animateHeroIntro() {
    if (!window.gsap) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-left > *', {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
    });

    tl.from(
      '.hero-right > *',
      {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
      },
      '-=0.55'
    );
  }

  function initHeaderScrollState() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    function onScroll() {
      const scrolled = window.scrollY > 24;
      header.classList.toggle('site-header--scrolled', scrolled);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    const linkById = {};
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        linkById[href.slice(1)] = link;
      }
    });

    function setActive(id) {
      Object.keys(linkById).forEach((key) => {
        const link = linkById[key];
        if (!link) return;
        link.classList.toggle('nav-link-active', key === id);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        root: null,
        threshold: 0.4,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    root.classList.toggle('theme-light', isLight);

    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const label = toggle.querySelector('.theme-toggle-label');
    const icon = toggle.querySelector('.theme-toggle-icon');
    toggle.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');

    if (label) {
      label.textContent = isLight ? 'Light' : 'Dark';
    }
    if (icon) {
      icon.classList.toggle('is-light', isLight);
    }
  }

  function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const stored = window.localStorage ? window.localStorage.getItem('theme') : null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (prefersDark ? 'dark' : 'dark');

    applyTheme(initial);

    toggle.addEventListener('click', () => {
      const current = toggle.getAttribute('data-theme') || initial;
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      if (window.localStorage) {
        window.localStorage.setItem('theme', next);
      }
    });
  }

  function startExperience() {
    if (hasStarted) return;
    hasStarted = true;

    if (window.gsap) {
      gsap.to(loaderEl, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          loaderEl.style.display = 'none';
        },
      });
    } else {
      loaderEl.style.display = 'none';
    }

    initScrollAnimation();
    animateHeroIntro();
  }

  function initMagneticButtons() {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  function initCursorSpotlight() {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    const spotlight = document.getElementById('cursor-spotlight');
    if (!spotlight) return;

    let hasEntered = false;
    let xTo = null;
    let yTo = null;

    if (window.gsap) {
      xTo = gsap.quickTo(spotlight, 'x', { duration: 0.35, ease: 'expo.out' });
      yTo = gsap.quickTo(spotlight, 'y', { duration: 0.35, ease: 'expo.out' });
    }

    function move(e) {
      const x = e.clientX;
      const y = e.clientY;

      if (xTo && yTo) {
        xTo(x);
        yTo(y);
      } else {
        spotlight.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (!hasEntered) {
        hasEntered = true;
        spotlight.style.opacity = '1';
      }
    }

    document.addEventListener('mousemove', move);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Kick everything off
  startBackground();
  runLoader();
  initMagneticButtons();
  initCursorSpotlight();
  initHeaderScrollState();
  initScrollSpy();
  initThemeToggle();

  enterBtn.addEventListener('click', startExperience);

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
