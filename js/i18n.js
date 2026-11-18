const I18n = {
  currentLang: localStorage.getItem('fb-lang') || 'it',

  init() {
    this.apply(this.currentLang);
    this.updateToggle();
  },

  apply(lang) {
    this.currentLang = lang;
    localStorage.setItem('fb-lang', lang);
    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = t[key];
        } else {
          el.textContent = t[key];
        }
      }
    });

    // Attributi: alt delle immagini e content dei meta
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      if (t[key]) el.alt = t[key];
    });

    document.querySelectorAll('[data-i18n-content]').forEach(el => {
      const key = el.getAttribute('data-i18n-content');
      if (t[key]) el.content = t[key];
    });

    document.documentElement.lang = lang;
    this.updateToggle();
  },

  toggle() {
    const next = this.currentLang === 'it' ? 'en' : 'it';
    this.apply(next);
  },

  updateToggle() {
    const t = translations[this.currentLang];
    document.querySelectorAll('[data-i18n-toggle]').forEach(el => {
      el.textContent = t['nav.lang'];
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});
