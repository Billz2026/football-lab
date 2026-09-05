const id = 'flm-mobile-home-v049';
if (!document.getElementById(id)) {
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = './mobile-home-v049.css?v=0.4.9';
  document.head.appendChild(link);
}

document.documentElement.dataset.mobileHome = 'v049';
