/* Football Lab Manager — force the instant-profile cache hot immediately. */

function warmInstantProfile() {
  const api = window.FLMPlayerProfile;
  if (!api?.preload) return false;
  api.preload();
  return true;
}

if (!warmInstantProfile()) {
  const timer = setInterval(() => {
    if (warmInstantProfile()) clearInterval(timer);
  }, 10);
  setTimeout(() => clearInterval(timer), 5000);
}
