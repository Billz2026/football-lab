const id = 'flm-mobile-home-v049';
const compatibilityStyleId = 'flm-mobile-home-v049-compat';

if (!document.getElementById(compatibilityStyleId)) {
  const style = document.createElement('style');
  style.id = compatibilityStyleId;
  style.textContent = `
    @media (max-width: 1000px) {
      html[data-mobile-home="v049"] .menu-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      html[data-mobile-home="v049"] .menu-tile {
        grid-column: auto !important;
      }
    }

    @media (max-width: 600px) {
      html[data-mobile-home="v049"] .menu-grid {
        grid-template-columns: 1fr !important;
      }

      html[data-mobile-home="v049"] .menu-tile,
      html[data-mobile-home="v049"] body.compact .menu-tile {
        min-height: 62px !important;
        padding: 11px 14px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

const markReady = () => {
  document.documentElement.dataset.mobileHome = 'v049';
};

const existing = document.getElementById(id);
if (!existing) {
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = './mobile-home-v049.css?v=0.4.12';
  link.addEventListener('load', markReady, { once: true });
  link.addEventListener('error', markReady, { once: true });
  document.head.appendChild(link);
} else if (existing.sheet) {
  markReady();
} else {
  existing.addEventListener('load', markReady, { once: true });
  existing.addEventListener('error', markReady, { once: true });
}

const heroNote = document.querySelector('.hero-note');
if (heroNote) heroNote.textContent = 'FULL LEAGUE BETA · 20 CLUBS · 38 MATCHES';
