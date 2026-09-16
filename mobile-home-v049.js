const id = 'flm-mobile-home-v049';
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
