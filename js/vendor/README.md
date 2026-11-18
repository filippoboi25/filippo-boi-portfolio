# Librerie di terze parti

File copiati dai pacchetti npm ufficiali (`npm pack`), senza modifiche al codice. Nessun CDN: il sito li serve da qui.
Caricati con `defer` da: home, lavori, contatti e tutti i case study, tranne `lavori/i-santi.html`.

| File | Versione | Pacchetto npm | Pubblicato | Peso | gzip -9 |
|---|---|---|---|---|---|
| `gsap.min.js` | 3.15.1 | `gsap` (`dist/gsap.min.js`) | 2026-11-04 | 73 357 B | 28 415 B |
| `ScrollTrigger.min.js` | 3.15.1 | `gsap` (`dist/ScrollTrigger.min.js`) | 2026-11-04 | 44 683 B | 18 034 B |
| `lenis.min.js` | 1.3.27 | `lenis` (`dist/lenis.min.js`) | 2026-10-15 | 18 952 B | 5 524 B |

Per aggiornare: `npm pack gsap@<versione>` / `npm pack lenis@<versione>`, copiare gli stessi file da `dist/`, aggiornare questa tabella e i commenti in `js/motion.js`.

## Licenze

### GSAP e ScrollTrigger
- Il pacchetto non contiene un file di licenza. `package.json` dichiara: *"Standard 'no charge' license: https://gsap.com/standard-license."*; l'intestazione dei file dice *"Subject to the terms at https://gsap.com/standard-license"*.
- Testo letto su https://gsap.com/standard-license (in vigore dal 30/04/2025, ultima modifica 30/05/2025): licenza gratuita concessa da Webflow per l'uso di GSAP *"on any website, web application, or digital interface"*, anche in progetti commerciali.
- Vincoli rilevanti: è vietato rimuovere o alterare le note di proprietà (per questo le intestazioni `@license` dei file sono intatte); sono vietati usi per strumenti no-code concorrenti di Webflow (non è il caso di questo sito).

### Lenis
- Licenza MIT, Copyright (c) 2024 darkroom.engineering. Testo completo in `LICENSE-lenis.txt` (copiato dal pacchetto).
- Il file minificato del pacchetto non ha intestazione: è stata aggiunta in cima a `lenis.min.js` una riga di commento con versione, licenza e copyright, ed è stato tolto il riferimento alla source map (non pubblicata).
