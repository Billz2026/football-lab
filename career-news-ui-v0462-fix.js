const id = 'flm-news-v0462-hidden-fix';
if (!document.getElementById(id)) {
  const style = document.createElement('style');
  style.id = id;
  style.textContent = '.v046-news-badge[hidden]{display:none!important}';
  document.head.appendChild(style);
}
