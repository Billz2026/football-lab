/* Football Lab Manager — premium career shell stylesheet loader v1 */
const STYLE_ID = 'flm-career-shell-premium-v1';
if (!document.getElementById(STYLE_ID)) {
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = './career-shell-premium-v1.css?v=1.0.0';
  document.head.appendChild(link);
}
