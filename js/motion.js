/* motion.js — sistema di motion del sito (fase 4)
   Dipende da: js/vendor/gsap.min.js 3.15.1, js/vendor/ScrollTrigger.min.js 3.15.1,
               js/vendor/lenis.min.js 1.3.27 (caricati con defer prima di questo file).

   API nell'HTML (attributo data-motion):
     title     titolo diviso in parole, ogni parola sale da una maschera
     image     il blocco si scopre dal basso con clip-path, l'immagine si assesta
     fade      semplice dissolvenza (paragrafi, etichette, metadati)
     group     i figli diretti entrano in cascata: titoli → title, immagini → image, il resto → fade
     card      card dei lavori: immagine scoperta con clip-path, testi in dissolvenza;
               da desktop parallax contenuto dell'immagine dentro la maschera
     manifesto blocco dell'Approccio: riceve .is-in (le transizioni restano nel CSS)

   Regole:
   - Gli stati nascosti stanno nel CSS solo sotto html.js:not(.motion-off) e con
     prefers-reduced-motion: no-preference. Senza JS o con movimento ridotto tutto
     è visibile e fermo; se questo file non parte entro 3 s, l'head aggiunge
     .motion-off e il contenuto si mostra.
   - Si animano solo transform, opacity e clip-path.
   - Lenis e parallax solo con puntatore preciso e schermo ≥ 1024px.
   - Il cambio lingua (evento i18n:change) rifà la divisione in parole. */

(function () {
  'use strict';

  const html = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Cambio pagina: la pagina che esce segnala alla successiva che c'è una
  // View Transition, così l'apertura non anima di nuovo la barra di navigazione.
  window.addEventListener('pageswap', (e) => {
    if (e.viewTransition) {
      try { sessionStorage.setItem('fb-vt', '1'); } catch (err) { /* storage non disponibile */ }
    }
  });

  if (html.classList.contains('motion-off')) return;          // failsafe già scattato
  if (reduced.matches || !window.gsap || !window.ScrollTrigger) {
    html.classList.add('motion-off');
    return;
  }
  html.classList.add('motion-ready');

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'expo.out';            // vicino a --ease-out cubic-bezier(0.16, 1, 0.3, 1)
  const DUR = 0.9;
  const HEADING = 'h1, h2, h3, .cs-section-headline';
  const IMAGE = '.cs-image, .work-card__media, img';

  // Se il movimento ridotto viene attivato a pagina aperta: tutto visibile e fermo.
  reduced.addEventListener('change', (e) => {
    if (!e.matches) return;
    mm.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    html.classList.add('motion-off');
    document.querySelectorAll('[data-motion], [data-motion] > *, .m-word__inner, .nav')
      .forEach((el) => gsap.set(el, { clearProps: 'all' }));
    document.querySelectorAll('.manifesto__item').forEach((el) => el.classList.add('is-in'));
  });

  // ─── Divisione dei titoli in parole ──────────────────────
  // Ogni parola: <span class="m-word"><span class="m-word__inner">…</span></span>.
  // Gli spazi restano nodi di testo, quindi lettori di schermo e selezione leggono
  // il testo normale. Gli elementi annidati (es. <br>, <em>) vengono conservati.
  function split(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('.m-word')) nodes.push(walker.currentNode);
    }
    nodes.forEach((node) => {
      const parts = node.textContent.split(/(\s+)/);
      if (!parts.some((p) => p.trim())) return;
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'm-word';
        inner.className = 'm-word__inner';
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.replaceWith(frag);
    });
    el.dataset.split = 'true';
  }

  function prepareTitle(el) {
    split(el);
    const words = el.querySelectorAll('.m-word__inner');
    if (el.dataset.motionDone) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    gsap.set(words, { yPercent: 110 });
    gsap.set(el, { opacity: 1 });
  }

  // ─── Animazioni di entrata ───────────────────────────────
  function animTitle(el, delay) {
    const words = el.querySelectorAll('.m-word__inner');     // letti ora: dopo un cambio lingua sono nuovi
    el.dataset.motionDone = 'true';
    return gsap.to(words, {
      yPercent: 0, duration: DUR, ease: EASE, delay, stagger: 0.06,
      onComplete: () => gsap.set(words, { clearProps: 'transform' }),
    });
  }

  function animImage(el, delay, scaleImage = true) {
    el.dataset.motionDone = 'true';
    const img = el.tagName === 'IMG' ? null : el.querySelector('img');
    const tl = gsap.timeline({ delay });
    tl.fromTo(el,
      { clipPath: 'inset(100% 0% 0% 0%)', opacity: 1 },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut',
        onStart: () => { el.style.willChange = 'clip-path'; },
        onComplete: () => { gsap.set(el, { clipPath: 'none' }); el.style.willChange = ''; } });
    if (img && scaleImage) {
      tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.4, ease: EASE,
        onComplete: () => gsap.set(img, { clearProps: 'transform' }) }, 0);
    }
    return tl;
  }

  function animFade(el, delay) {
    el.dataset.motionDone = 'true';
    return gsap.to(el, { opacity: 1, duration: 0.8, ease: 'power2.out', delay });
  }

  function animGroup(el, delay) {
    el.dataset.motionDone = 'true';
    gsap.set(el, { opacity: 1 });
    [...el.children].forEach((child, i) => run(child, kindOf(child), delay + i * 0.1));
  }

  function animCard(el, delay) {
    el.dataset.motionDone = 'true';
    gsap.set(el, { opacity: 1 });
    const media = el.querySelector('.work-card__media');
    const texts = [...el.children].filter((c) => c !== media);
    const tl = gsap.timeline({ delay });
    tl.add(animImage(media, 0, false), 0);
    tl.to(texts, { opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.06 }, 0.35);
    return tl;
  }

  function kindOf(el) {
    if (el.dataset.motion) return el.dataset.motion;
    if (el.matches(HEADING)) return 'title';
    if (el.matches(IMAGE) || el.querySelector('img')) return 'image';
    return 'fade';
  }

  function run(el, kind, delay) {
    if (kind === 'title') {
      if (!el.dataset.split) prepareTitle(el);
      return animTitle(el, delay);
    }
    if (kind === 'image') return animImage(el, delay);
    if (kind === 'group') return animGroup(el, delay);
    if (kind === 'card') return animCard(el, delay);
    return animFade(el, delay);
  }

  // ─── Avvio (dopo i18n: i titoli si dividono già nella lingua giusta) ──
  const mm = gsap.matchMedia();

  function start() {
    const vtIn = html.classList.contains('vt-in');
    const els = [...document.querySelectorAll('[data-motion]')].filter((el) => el.dataset.motion !== 'manifesto');

    // I titoli (anche quelli dentro i gruppi) si dividono subito: le parole partono nascoste.
    els.forEach((el) => {
      if (el.dataset.motion === 'title') prepareTitle(el);
      if (el.dataset.motion === 'group') {
        [...el.children].forEach((c) => { if (kindOf(c) === 'title') prepareTitle(c); });
      }
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Apertura: barra di navigazione (non dopo un cambio pagina con View Transition),
      // poi gli elementi già in vista, in cascata.
      const t0 = performance.now();
      const introDelay = vtIn ? 0.3 : 0.25;
      if (!vtIn) gsap.fromTo('.nav', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.8, ease: EASE, clearProps: 'transform' });

      ScrollTrigger.batch(els, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          const base = performance.now() - t0 < 700 ? introDelay : 0;
          batch.forEach((el, i) => run(el, el.dataset.motion, base + i * 0.09));
        },
      });

      document.querySelectorAll('[data-motion="manifesto"]').forEach((item) => {
        ScrollTrigger.create({
          trigger: item.querySelector('.manifesto__word') || item,
          start: 'top 80%',
          once: true,
          onEnter: () => item.classList.add('is-in'),
        });
      });
    });

    // Desktop con puntatore preciso: Lenis e parallax delle card.
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (pointer: fine)', () => {
      let lenis = null;
      if (window.Lenis) {
        lenis = new window.Lenis({ anchors: true, lerp: 0.1, wheelMultiplier: 1 });
        lenis.on('scroll', ScrollTrigger.update);
        const tick = (time) => lenis.raf(time * 1000);   // un solo ticker: quello di GSAP
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        lenis.__tick = tick;
      }

      document.querySelectorAll('[data-motion="card"] .work-card__media').forEach((media) => {
        const img = media.querySelector('img');
        if (!img) return;
        gsap.fromTo(img, { yPercent: -4, scale: 1.14 }, {
          yPercent: 4, scale: 1.09, ease: 'none',
          scrollTrigger: {
            trigger: media, start: 'top bottom', end: 'bottom top', scrub: true,
            onToggle: (self) => { img.style.willChange = self.isActive ? 'transform' : ''; },
          },
        });
      });

      return () => {
        if (lenis) {
          gsap.ticker.remove(lenis.__tick);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        }
      };
    });

    // Immagini lazy dentro blocchi ancora chiusi dal clip-path: Chrome non le
    // carica finché il ritaglio è totale. Si avvia il caricamento con 1500px di
    // anticipo osservando il genitore (non ritagliato), così l'immagine è pronta
    // quando il blocco si scopre.
    if ('IntersectionObserver' in window) {
      const lazy = new Map();
      document.querySelectorAll('[data-motion] img[loading="lazy"], img[data-motion][loading="lazy"]').forEach((img) => {
        const host = img.closest('[data-motion]');
        const watch = host.dataset.motion === 'card' ? host : host.parentElement;
        if (!lazy.has(watch)) lazy.set(watch, []);
        lazy.get(watch).push(img);
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          lazy.get(entry.target).forEach((img) => { img.loading = 'eager'; });
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 1500px 0px' });
      lazy.forEach((imgs, watch) => io.observe(watch));
    }

    // Le misure cambiano quando arrivano font e immagini.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  // Cambio lingua: i18n.js ha sostituito il testo dei titoli divisi → si rifà la divisione.
  document.addEventListener('i18n:change', () => {
    document.querySelectorAll('[data-split="true"]').forEach((el) => {
      if (el.querySelector('.m-word')) return;               // testo non cambiato
      delete el.dataset.split;
      prepareTitle(el);
    });
    ScrollTrigger.refresh();
  });

  // Questo file è caricato con defer: gira prima di DOMContentLoaded, quando
  // readyState è già "interactive". Il listener è registrato dopo quello di
  // i18n.js, quindi parte dopo la traduzione. Se la pagina fosse già caricata,
  // si parte subito; negli altri casi il failsafe dell'head mostra il contenuto.
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
