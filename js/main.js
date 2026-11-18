// ─── Movimento ridotto ─────────────────────────────────────
// Chiama onChange(reduced) subito e a ogni cambio di preferenza.
function watchReducedMotion(onChange) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  onChange(query.matches);
  query.addEventListener('change', (e) => onChange(e.matches));
}

(function () {
  'use strict';

  // ─── Cursor ───────────────────────────────────────────────
  // Con movimento ridotto il cursore personalizzato è spento:
  // il CSS lo nasconde e ripristina quello nativo, qui si fermano
  // listener e loop.
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let cursorRaf = null;

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  }

  // single handler — reflects current state on every mouseover
  function onMouseOver(e) {
    const over = !!e.target.closest('a, button, .card');
    dot.classList.toggle('is-hovering', over);
    ring.classList.toggle('is-hovering', over);
  }

  function tickCursor() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    cursorRaf = requestAnimationFrame(tickCursor);
  }

  function startCursor() {
    if (!dot || !ring || cursorRaf !== null) return;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    cursorRaf = requestAnimationFrame(tickCursor);
  }

  function stopCursor() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseover', onMouseOver);
    if (cursorRaf !== null) cancelAnimationFrame(cursorRaf);
    cursorRaf = null;
  }

  watchReducedMotion((reduced) => (reduced ? stopCursor() : startCursor()));

  // ─── Nav scrolled ─────────────────────────────────────────
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }, { passive: true });

  // ─── Scroll reveal ────────────────────────────────────────
  // Con movimento ridotto: niente observer, tutto subito visibile.
  const revealEls = document.querySelectorAll('.reveal');
  let revealObserver = null;

  function showAllReveals() {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  function enableReveal() {
    if (revealObserver) return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => {
      if (!el.classList.contains('is-visible')) revealObserver.observe(el);
    });
  }

  function disableReveal() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    showAllReveals();
  }

  watchReducedMotion((reduced) => (reduced ? disableReveal() : enableReveal()));

  // ─── Canvas dot grid ──────────────────────────────────────
  // Con movimento ridotto: un solo frame statico, nessun loop.
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx        = canvas.getContext('2d');
  const SPACING    = 28;
  const RADIUS     = 0.8;
  const BASE_ALPHA = 0.15;

  let dots = [];
  let rafId = null;
  let reducedMotion = false;

  function buildGrid() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cols = Math.ceil(canvas.width  / SPACING) + 1;
    const rows = Math.ceil(canvas.height / SPACING) + 1;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // diagonal phase offset — creates slow wave across the grid
        dots.push({ x: c * SPACING, y: r * SPACING, phase: c * 0.3 + r * 0.7 });
      }
    }
  }

  function paint(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
      // alpha breathes between 0.09 and 0.15
      const alpha = BASE_ALPHA * (0.6 + 0.4 * Math.sin(t * 0.0008 + d.phase));
      ctx.beginPath();
      ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,228,220,${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  function draw(t) {
    paint(t);
    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (reducedMotion) {
      paint(0);
    } else {
      rafId = requestAnimationFrame(draw);
    }
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  buildGrid();

  watchReducedMotion((reduced) => {
    reducedMotion = reduced;
    stop();
    start();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      stop();
      buildGrid();
      start();
    }, 150);
  });

}());

(function() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -1000, y: -1000 };
  const COUNT = 280;
  const ORANGE = '#E35A1B';
  const PAPER = '#e8e4dc';
  let rafId = null;
  let reducedMotion = false;

  function resize() {
    W = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function createParticle() {
    return {
      x: Math.random() * (W / window.devicePixelRatio),
      y: Math.random() * (H / window.devicePixelRatio),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.92 ? ORANGE : PAPER,
      alpha: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    };
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push(createParticle());
    }
  }

  // animate = false → disegna le particelle ferme (frame statico)
  function paint(animate) {
    const w = W / window.devicePixelRatio;
    const h = H / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // Connessioni tra particelle vicine
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(232, 228, 220, ${0.06 * (1 - dist / 80)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      if (animate) {
        // Repulsione dal mouse
        const mx = mouse.x;
        const my = mouse.y;
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }

        // Attrito
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Rimbalzo bordi
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }

      const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color === ORANGE
        ? `rgba(227, 90, 27, ${alpha})`
        : `rgba(232, 228, 220, ${alpha})`;
      ctx.fill();
    });
  }

  function draw() {
    paint(true);
    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (reducedMotion) {
      paint(false);
    } else if (rafId === null) {
      draw();
    }
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener('resize', () => {
    resize();
    init();
    if (reducedMotion) paint(false);
  });

  resize();
  init();

  watchReducedMotion((reduced) => {
    reducedMotion = reduced;
    stop();
    start();
  });
})();

// Hamburger menu
(function() {
  const hamburger = document.querySelector('.nav-hamburger');
  const overlay = document.querySelector('.nav-mobile-overlay');
  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('is-open');
    overlay.classList.toggle('is-open');
    document.body.style.overflow =
      overlay.classList.contains('is-open') ? 'hidden' : '';
  });

  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  const closeBtn = document.querySelector('.nav-mobile-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hamburger.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  }
})();
