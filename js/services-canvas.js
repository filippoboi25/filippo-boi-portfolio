// services-canvas.js — flow field hero + reactive dot grid + accordion + phase observer

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // A) FLOW FIELD — #services-canvas
  // ══════════════════════════════════════════════════════════════

  const heroCanvas = document.getElementById('services-canvas');
  if (heroCanvas) {
    const hCtx = heroCanvas.getContext('2d');
    let hW, hH, hDpr;
    const hMouse = { x: -9999, y: -9999 };
    let hParticles = [];
    let hAnimId;

    const PARTICLE_COUNT = 700;
    const ORANGE_RATIO   = 0.10;
    const MOUSE_RADIUS   = 120;

    // pseudo-noise via sum of sin/cos — no libraries
    function noise(x, y, t) {
      return (
        Math.sin(x * 0.31 + t) * Math.cos(y * 0.22 - t * 0.71) +
        Math.cos(x * 0.17 - t * 0.53) * Math.sin(y * 0.38 + t * 0.89) * 0.6 +
        Math.sin((x + y) * 0.11 + t * 0.4) * 0.3
      );
    }

    function flowAngle(px, py, t) {
      return noise(px / 90, py / 90, t) * Math.PI * 2;
    }

    function initParticles() {
      hParticles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        hParticles.push({
          x:       Math.random() * hW,
          y:       Math.random() * hH,
          speed:   0.4 + Math.random() * 0.9,
          life:    Math.floor(Math.random() * 220),
          maxLife: 140 + Math.floor(Math.random() * 120),
          isOrange: i < PARTICLE_COUNT * ORANGE_RATIO,
        });
      }
    }

    function resizeHero() {
      hDpr = window.devicePixelRatio || 1;
      hW   = heroCanvas.clientWidth;
      hH   = heroCanvas.clientHeight;
      heroCanvas.width  = hW * hDpr;
      heroCanvas.height = hH * hDpr;
      hCtx.scale(hDpr, hDpr);
      initParticles();
    }

    let hT = 0;

    function tickHero() {
      hCtx.clearRect(0, 0, hW, hH);
      hT += 0.003;

      for (let i = 0; i < hParticles.length; i++) {
        const p = hParticles[i];

        // base flow angle
        let angle = flowAngle(p.x, p.y, hT);

        // mouse repulsion within radius
        const dxM  = p.x - hMouse.x;
        const dyM  = p.y - hMouse.y;
        const dist = Math.sqrt(dxM * dxM + dyM * dyM);
        if (dist < MOUSE_RADIUS) {
          const strength  = (1 - dist / MOUSE_RADIUS);
          const repelAng  = Math.atan2(dyM, dxM);
          angle += (repelAng - angle) * strength * 0.75;
        }

        const vx = Math.cos(angle) * p.speed;
        const vy = Math.sin(angle) * p.speed;

        p.x += vx;
        p.y += vy;
        p.life++;

        // wrap edges
        if (p.x < -2)      p.x = hW + 2;
        else if (p.x > hW + 2) p.x = -2;
        if (p.y < -2)      p.y = hH + 2;
        else if (p.y > hH + 2) p.y = -2;

        // reset at end of life
        if (p.life >= p.maxLife) {
          p.life = 0;
          p.x    = Math.random() * hW;
          p.y    = Math.random() * hH;
        }

        const lifeFrac = p.life / p.maxLife;
        const alpha    = Math.sin(lifeFrac * Math.PI);

        // trail
        hCtx.beginPath();
        hCtx.moveTo(p.x, p.y);
        hCtx.lineTo(p.x - vx * 7, p.y - vy * 7);
        hCtx.lineWidth = 1;
        if (p.isOrange) {
          hCtx.strokeStyle = `rgba(227,90,27,${0.5 * alpha})`;
        } else {
          hCtx.strokeStyle = `rgba(240,236,228,${0.22 * alpha})`;
        }
        hCtx.stroke();

        // dot
        hCtx.beginPath();
        hCtx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        if (p.isOrange) {
          hCtx.fillStyle = `rgba(227,90,27,${0.5 * alpha})`;
        } else {
          hCtx.fillStyle = `rgba(240,236,228,${0.22 * alpha})`;
        }
        hCtx.fill();
      }

      hAnimId = requestAnimationFrame(tickHero);
    }

    heroCanvas.addEventListener('mousemove', function (e) {
      const r    = heroCanvas.getBoundingClientRect();
      hMouse.x   = e.clientX - r.left;
      hMouse.y   = e.clientY - r.top;
    });

    heroCanvas.addEventListener('mouseleave', function () {
      hMouse.x = -9999;
      hMouse.y = -9999;
    });

    window.addEventListener('resize', resizeHero);
    resizeHero();
    tickHero();
  }


  // ══════════════════════════════════════════════════════════════
  // B) REACTIVE DOT GRID — #approach-canvas
  // ══════════════════════════════════════════════════════════════

  const approachCanvas = document.getElementById('approach-canvas');
  if (approachCanvas) {
    const aCtx = approachCanvas.getContext('2d');
    let aW, aH, aDpr;
    const aMouse = { x: -9999, y: -9999 };
    let aDots = [];
    let aAnimId;

    const SPACING       = 32;
    const DOT_R         = 0.8;
    const BASE_OPACITY  = 0.05;
    const HOVER_OPACITY = 0.3;
    const HOVER_RADIUS  = 100;
    const ORANGE_PROB   = 0.05;
    const PULL_STRENGTH = 0.12;
    const LERP          = 0.1;

    function initDots() {
      aDots = [];
      const cols = Math.ceil(aW / SPACING) + 1;
      const rows = Math.ceil(aH / SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = c * SPACING;
          const oy = r * SPACING;
          aDots.push({
            ox, oy,
            x: ox, y: oy,
            isOrange: Math.random() < ORANGE_PROB,
          });
        }
      }
    }

    function resizeApproach() {
      aDpr = window.devicePixelRatio || 1;
      aW   = approachCanvas.clientWidth;
      aH   = approachCanvas.clientHeight;
      approachCanvas.width  = aW * aDpr;
      approachCanvas.height = aH * aDpr;
      aCtx.scale(aDpr, aDpr);
      initDots();
    }

    function tickApproach() {
      aCtx.clearRect(0, 0, aW, aH);

      for (let i = 0; i < aDots.length; i++) {
        const d   = aDots[i];
        const dx  = d.ox - aMouse.x;
        const dy  = d.oy - aMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = d.ox;
        let targetY = d.oy;
        let opacity = BASE_OPACITY;

        if (dist < HOVER_RADIUS) {
          const t   = 1 - dist / HOVER_RADIUS;
          opacity   = BASE_OPACITY + (HOVER_OPACITY - BASE_OPACITY) * t;
          // pull toward cursor
          targetX   = d.ox - dx * t * PULL_STRENGTH;
          targetY   = d.oy - dy * t * PULL_STRENGTH;
        }

        d.x += (targetX - d.x) * LERP;
        d.y += (targetY - d.y) * LERP;

        aCtx.beginPath();
        aCtx.arc(d.x, d.y, DOT_R, 0, Math.PI * 2);

        if (d.isOrange && dist < HOVER_RADIUS) {
          aCtx.fillStyle = `rgba(227,90,27,${opacity})`;
        } else {
          aCtx.fillStyle = `rgba(232,228,220,${opacity})`;
        }
        aCtx.fill();
      }

      aAnimId = requestAnimationFrame(tickApproach);
    }

    const approachSection = document.getElementById('approach');
    if (approachSection) {
      approachSection.addEventListener('mousemove', function (e) {
        const r  = approachCanvas.getBoundingClientRect();
        aMouse.x = e.clientX - r.left;
        aMouse.y = e.clientY - r.top;
      });

      approachSection.addEventListener('mouseleave', function () {
        aMouse.x = -9999;
        aMouse.y = -9999;
      });
    }

    window.addEventListener('resize', resizeApproach);
    resizeApproach();
    tickApproach();
  }


  // ══════════════════════════════════════════════════════════════
  // C) PHASE NUMBER — IntersectionObserver (border → orange)
  // ══════════════════════════════════════════════════════════════

  const phases = document.querySelectorAll('.svc-phase');
  if (phases.length) {
    const phaseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.3 });

    phases.forEach(function (p) { phaseObserver.observe(p); });
  }


  // ══════════════════════════════════════════════════════════════
  // D) ACCORDION — one-open-at-a-time
  // ══════════════════════════════════════════════════════════════

  const svcItems = document.querySelectorAll('.svc-item');

  svcItems.forEach(function (item) {
    const btn   = item.querySelector('.svc-item__btn');
    const panel = item.querySelector('.svc-item__panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');

      // close all
      svcItems.forEach(function (other) {
        other.classList.remove('is-open');
        const b = other.querySelector('.svc-item__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      // open this one if it was closed
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });


  // ══════════════════════════════════════════════════════════════
  // E) BRIDGE — terrain wireframe pseudo-3D
  // ══════════════════════════════════════════════════════════════

  var bridgeCanvas = document.getElementById('bridge-canvas');
  if (bridgeCanvas) {
    var bCtx = bridgeCanvas.getContext('2d');
    var bW, bH, bDpr;

    // grid resolution
    var COLS = 60;
    var ROWS = 30;

    // perspective
    var FOV        = 280;
    var SPACING    = 46;   // world-unit spacing between grid points
    var AMP_BASE   = 38;   // base wave amplitude

    // mouse state (lerped)
    var bMouseRaw  = { x: -9999, y: -9999 };
    var bMouseLerp = { x: -9999, y: -9999 };
    var bT = 0;

    var isTouchDevice = (window.matchMedia('(max-width: 768px)').matches);

    function bResize() {
      bDpr           = window.devicePixelRatio || 1;
      bW             = bridgeCanvas.clientWidth;
      bH             = bridgeCanvas.clientHeight;
      bridgeCanvas.width  = bW * bDpr;
      bridgeCanvas.height = bH * bDpr;
      bCtx.scale(bDpr, bDpr);
      isTouchDevice  = window.matchMedia('(max-width: 768px)').matches;
    }

    // project a world-space grid point to canvas screen coords
    // col, row: grid indices (0..COLS-1, 0..ROWS-1)
    // zExtra: additional height from mouse pressure
    function project(col, row, zExtra) {
      var amp       = AMP_BASE * (isTouchDevice ? 1.4 : 1.0);
      var horizonY  = bH * 0.25;
      var centerX   = bW * 0.5;
      var centerCol = (COLS - 1) / 2;

      // row depth: row 0 is farthest (horizon), row ROWS-1 is closest
      var rowDepth  = row + 1; // 1 .. ROWS
      var scale     = FOV / (FOV + (ROWS - row) * SPACING * 0.55);

      var gx        = (col - centerCol) * SPACING;
      var screenX   = centerX + gx * scale;

      // height from sinusoidal field
      var nx        = col * 0.28;
      var ny        = row * 0.22;
      var z = (
        Math.sin(nx + bT)          * Math.cos(ny + bT * 0.7)       * amp +
        Math.cos(nx * 0.6 - bT * 0.5) * Math.sin(ny * 0.5 + bT * 0.9) * amp * 0.5 +
        Math.sin((nx + ny) * 0.4 + bT * 0.6) * amp * 0.25
      ) + zExtra;

      var screenY   = horizonY + (ROWS - row) * SPACING * 0.55 * scale - z * scale;

      // depth fraction 0 (far) .. 1 (near) for alpha
      var depthFrac = row / (ROWS - 1);

      return { x: screenX, y: screenY, depth: depthFrac };
    }

    // pre-compute mouse pressure for each grid point
    function computePressure() {
      // lerp mouse position
      if (bMouseRaw.x > -999) {
        bMouseLerp.x += (bMouseRaw.x - bMouseLerp.x) * 0.12;
        bMouseLerp.y += (bMouseRaw.y - bMouseLerp.y) * 0.12;
      }
    }

    function bTick() {
      bCtx.clearRect(0, 0, bW, bH);
      bT += 0.008;

      computePressure();

      var MOUSE_RADIUS = 260;

      // cache projected points and their pressure for the current frame
      // points[row][col] = {x, y, depth, pressure}
      var points = [];
      for (var r = 0; r < ROWS; r++) {
        points[r] = [];
        for (var c = 0; c < COLS; c++) {
          // compute screen position WITHOUT zExtra first (to find proximity)
          var pt0    = project(c, r, 0);
          var dx     = pt0.x - bMouseLerp.x;
          var dy     = pt0.y - bMouseLerp.y;
          var dist   = Math.sqrt(dx * dx + dy * dy);
          var falloff = dist < MOUSE_RADIUS
            ? Math.pow(1 - dist / MOUSE_RADIUS, 2)
            : 0;
          var zExtra = falloff * 140;
          var pt     = project(c, r, zExtra);
          pt.pressure = falloff;
          points[r][c] = pt;
        }
      }

      // draw horizontal lines (along columns, same row)
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS - 1; c++) {
          var a = points[r][c];
          var b = points[r][c + 1];
          drawSegment(a, b, MOUSE_RADIUS);
        }
      }

      // draw vertical lines (along rows, same column)
      for (var c = 0; c < COLS; c++) {
        for (var r = 0; r < ROWS - 1; r++) {
          var a = points[r][c];
          var b = points[r + 1][c];
          drawSegment(a, b, MOUSE_RADIUS);
        }
      }

      requestAnimationFrame(bTick);
    }

    function drawSegment(a, b, mouseRadius) {
      var depthAlpha = 0.03 + (a.depth + b.depth) * 0.5 * 0.22;
      var pressure = (a.pressure + b.pressure) * 0.5;

      // lineWidth: 0.75 base → 1.5 within 80px of cursor
      var midX = (a.x + b.x) * 0.5;
      var midY = (a.y + b.y) * 0.5;
      var midDx = midX - bMouseLerp.x;
      var midDy = midY - bMouseLerp.y;
      var midDist = Math.sqrt(midDx * midDx + midDy * midDy);
      var lw = midDist < 80
        ? 0.75 + (1 - midDist / 80) * 0.75
        : 0.75;

      bCtx.beginPath();
      bCtx.moveTo(a.x, a.y);
      bCtx.lineTo(b.x, b.y);
      bCtx.lineWidth = lw;

      if (pressure > 0.01) {
        // alpha blends depthAlpha → 0.9 as pressure increases
        var orangeAlpha = depthAlpha * (1 - pressure) + 0.9 * pressure;
        var r = Math.round(240 + (227 - 240) * pressure);
        var g = Math.round(236 + ( 90 - 236) * pressure);
        var bv= Math.round(228 + ( 27 - 228) * pressure);
        bCtx.strokeStyle = 'rgba(' + r + ',' + g + ',' + bv + ',' + orangeAlpha + ')';
      } else {
        bCtx.strokeStyle = 'rgba(240,236,228,' + depthAlpha + ')';
      }

      bCtx.stroke();
    }

    // mouse events
    bridgeCanvas.addEventListener('mousemove', function (e) {
      var rect    = bridgeCanvas.getBoundingClientRect();
      bMouseRaw.x = e.clientX - rect.left;
      bMouseRaw.y = e.clientY - rect.top;
      if (bMouseLerp.x < -998) {
        bMouseLerp.x = bMouseRaw.x;
        bMouseLerp.y = bMouseRaw.y;
      }
    });

    bridgeCanvas.addEventListener('mouseleave', function () {
      bMouseRaw.x  = -9999;
      bMouseRaw.y  = -9999;
    });

    // touch support
    bridgeCanvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var touch   = e.touches[0];
      var rect    = bridgeCanvas.getBoundingClientRect();
      bMouseRaw.x = touch.clientX - rect.left;
      bMouseRaw.y = touch.clientY - rect.top;
      if (bMouseLerp.x < -998) {
        bMouseLerp.x = bMouseRaw.x;
        bMouseLerp.y = bMouseRaw.y;
      }
    }, { passive: false });

    bridgeCanvas.addEventListener('touchend', function () {
      bMouseRaw.x = -9999;
      bMouseRaw.y = -9999;
    });

    window.addEventListener('resize', bResize);
    bResize();
    bTick();
  }


  // ══════════════════════════════════════════════════════════════
  // F) NEBULA EFFECT — accordion rows (desktop only)
  // ══════════════════════════════════════════════════════════════

  var nebAccordion = document.getElementById('servizi-list');
  if (nebAccordion) {
    var nebMq = window.matchMedia('(max-width: 768px)');

    var nebCanvas = document.createElement('canvas');
    nebCanvas.setAttribute('aria-hidden', 'true');
    nebCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';
    nebAccordion.style.position = 'relative';
    nebAccordion.insertBefore(nebCanvas, nebAccordion.firstChild);

    var nebCtx = nebCanvas.getContext('2d');
    var nebW = 0, nebH = 0, nebDpr = 1;

    function resizeNeb() {
      nebDpr           = window.devicePixelRatio || 1;
      nebW             = nebCanvas.clientWidth;
      nebH             = nebCanvas.clientHeight;
      nebCanvas.width  = Math.round(nebW * nebDpr);
      nebCanvas.height = Math.round(nebH * nebDpr);
      nebCtx.scale(nebDpr, nebDpr);
    }

    var nebParticles  = [];
    var MAX_NEB       = 300;
    var nebEmitting   = false;
    var nebActiveItem = null;
    var nebMX = 0, nebMY = 0;

    svcItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        if (nebMq.matches) return;
        if (item.classList.contains('is-open')) return;
        nebActiveItem = item;
        nebEmitting   = true;
      });
      item.addEventListener('mouseleave', function () {
        nebEmitting   = false;
        nebActiveItem = null;
      });
    });

    nebAccordion.addEventListener('mousemove', function (e) {
      if (nebMq.matches) return;
      var rect = nebCanvas.getBoundingClientRect();
      nebMX = e.clientX - rect.left;
      nebMY = e.clientY - rect.top;
    });

    function spawnNebParticle() {
      if (nebParticles.length >= MAX_NEB) nebParticles.shift();
      nebParticles.push({
        x:        nebMX + (Math.random() - 0.5) * 40,
        y:        nebMY + (Math.random() - 0.5) * 40,
        vx:       (Math.random() - 0.5) * 1.6,
        vy:       (Math.random() - 0.5) * 1.6,
        r0:       1 + Math.random() * 2,
        life:     0,
        maxLife:  60 + Math.floor(Math.random() * 41),
        offset:   Math.random() * Math.PI * 2,
        isOrange: Math.random() < 0.20,
      });
    }

    function nebTick() {
      requestAnimationFrame(nebTick);
      nebCtx.clearRect(0, 0, nebW, nebH);
      if (nebMq.matches) return;

      if (nebEmitting && nebActiveItem && !nebActiveItem.classList.contains('is-open')) {
        var n = Math.random() < 0.5 ? 3 : 4;
        for (var ei = 0; ei < n; ei++) spawnNebParticle();
      }

      for (var i = nebParticles.length - 1; i >= 0; i--) {
        var p = nebParticles[i];
        p.life++;
        if (p.life >= p.maxLife) { nebParticles.splice(i, 1); continue; }

        var t      = p.life / p.maxLife;
        var alpha  = Math.pow(1 - t, 1.8);
        var radius = p.r0 * (1 + t * 2);

        p.vx += Math.sin(p.life * 0.1 + p.offset) * 0.05;
        p.vy += Math.cos(p.life * 0.1 + p.offset + 1.2) * 0.05;
        p.x  += p.vx;
        p.y  += p.vy;

        var color = p.isOrange
          ? 'rgba(227,90,27,'   + alpha.toFixed(3) + ')'
          : 'rgba(240,236,228,' + alpha.toFixed(3) + ')';

        nebCtx.save();
        nebCtx.shadowBlur  = 8;
        nebCtx.shadowColor = color;
        nebCtx.fillStyle   = color;
        nebCtx.beginPath();
        nebCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        nebCtx.fill();
        nebCtx.restore();
      }
    }

    window.addEventListener('resize', resizeNeb);
    resizeNeb();
    nebTick();
  }


  // ══════════════════════════════════════════════════════════════
  // F) MAGNETIC TEXT — accordion title (desktop only)
  // ══════════════════════════════════════════════════════════════

  var magnetStates = [];
  var isMobileQuery = window.matchMedia('(max-width: 768px)');

  svcItems.forEach(function (item) {
    var btn   = item.querySelector('.svc-item__btn');
    var title = item.querySelector('.svc-item__title');
    if (!btn || !title) return;

    var state = { title: title, curX: 0, tarX: 0 };
    magnetStates.push(state);

    btn.addEventListener('mousemove', function (e) {
      if (isMobileQuery.matches) return;
      var rect  = btn.getBoundingClientRect();
      var relX  = e.clientX - rect.left;
      var ratio = (relX / rect.width) * 2 - 1; // -1 … +1
      state.tarX = ratio * 20;
    });

    btn.addEventListener('mouseleave', function () {
      state.tarX = 0;
    });
  });

  function rafMagnetic() {
    if (!isMobileQuery.matches) {
      magnetStates.forEach(function (s) {
        s.curX += (s.tarX - s.curX) * 0.1;
        s.title.style.transform = 'translateX(' + s.curX.toFixed(2) + 'px)';
      });
    } else {
      magnetStates.forEach(function (s) {
        s.title.style.transform = '';
      });
    }
    requestAnimationFrame(rafMagnetic);
  }
  rafMagnetic();


  // ══════════════════════════════════════════════════════════════
  // G) MARQUEE TOOL — hover color + click particle burst
  // ══════════════════════════════════════════════════════════════

  function spawnParticles(x, y) {
    var count = 8;
    for (var i = 0; i < count; i++) {
      (function (index) {
        var el = document.createElement('div');
        el.style.cssText = [
          'position:fixed',
          'left:' + x + 'px',
          'top:'  + y + 'px',
          'width:5px',
          'height:5px',
          'border-radius:50%',
          'background:#E35A1B',
          'pointer-events:none',
          'z-index:9998',
          'opacity:1',
          'will-change:transform,opacity',
        ].join(';');
        document.body.appendChild(el);

        var angle    = (index / count) * Math.PI * 2;
        var dist     = 28 + Math.random() * 28;
        var dx       = Math.cos(angle) * dist;
        var dy       = Math.sin(angle) * dist;
        var duration = 600;
        var start    = null;

        function step(ts) {
          if (!start) start = ts;
          var prog = (ts - start) / duration;
          if (prog >= 1) { el.remove(); return; }
          var ease = 1 - (1 - prog) * (1 - prog); // ease-out quad
          el.style.transform = 'translate(' + (dx * ease) + 'px,' + (dy * ease) + 'px)';
          el.style.opacity   = String(1 - prog);
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }(i));
    }
  }

  document.querySelectorAll('.svc-tool').forEach(function (tool) {
    tool.addEventListener('click', function (e) {
      spawnParticles(e.clientX, e.clientY);
    });
  });

}());
