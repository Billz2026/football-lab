const apply = () => {
  const button = document.querySelector('[data-v047-preseason-tab]');
  if (button && button.dataset.careerTab !== 'preseason') button.dataset.careerTab = 'preseason';
};
apply();
new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
