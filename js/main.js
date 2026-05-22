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

(function() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -1000, y: -1000 };
  const COUNT = 280;
  const ORANGE = '#E35A1B';
  const PAPER = '#e8e4dc';

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

  function draw() {
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

      const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color === ORANGE
        ? `rgba(227, 90, 27, ${alpha})`
        : `rgba(232, 228, 220, ${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
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
  });

  resize();
  init();
  draw();
})();
