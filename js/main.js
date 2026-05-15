(function () {
  'use strict';

  // ─── Cursor ───────────────────────────────────────────────
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // single handler — reflects current state on every mouseover
  document.addEventListener('mouseover', (e) => {
    const over = !!e.target.closest('a, button, .card');
    dot.classList.toggle('is-hovering', over);
    ring.classList.toggle('is-hovering', over);
  });

  (function tickCursor() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(tickCursor);
  }());

  // ─── Nav scrolled ─────────────────────────────────────────
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }, { passive: true });

  // ─── Scroll reveal ────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // ─── Canvas dot grid ──────────────────────────────────────
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx        = canvas.getContext('2d');
  const SPACING    = 28;
  const RADIUS     = 0.8;
  const BASE_ALPHA = 0.15;

  let dots = [];
  let rafId;

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

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
      // alpha breathes between 0.09 and 0.15
      const alpha = BASE_ALPHA * (0.6 + 0.4 * Math.sin(t * 0.0008 + d.phase));
      ctx.beginPath();
      ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,228,220,${alpha.toFixed(3)})`;
      ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }

  buildGrid();
  rafId = requestAnimationFrame(draw);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(rafId);
      buildGrid();
      rafId = requestAnimationFrame(draw);
    }, 150);
  });

}());
