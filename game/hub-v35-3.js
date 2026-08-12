const BUILD = "35.3.0";

function moveProfileIntoSettings() {
  const profile = document.getElementById("hubProfile");
  const howToPlay = document.getElementById("howToPlay");
  const modal = document.getElementById("settingsModalV22");
  const card = modal?.querySelector(".settings-card-v22");
  if (!profile || !card) return false;

  if (profile.parentElement !== card) {
    const settingsList = card.querySelector(".settings-list-v22");
    settingsList?.before(profile);
    profile.dataset.location = "settings";
  }

  const actions = card.querySelector(".settings-actions-v22");
  if (howToPlay && actions && howToPlay.parentElement !== actions) {
    actions.appendChild(howToPlay);
    howToPlay.classList.remove("hub-how-button");
    howToPlay.classList.add("button", "button-secondary");
  }

  return true;
}

function wireProfileNavigation() {
  const profileLink = document.querySelector(".hub-nav a[href='#hubProfile']");
  if (!profileLink || profileLink.dataset.settingsWired === "true") return;
  profileLink.dataset.settingsWired = "true";
  profileLink.href = "#";
  profileLink.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("settingsButtonV22")?.click();
  });
}

function declutterHub() {
  const homeLink = document.querySelector(".hub-nav a[href='#hubHome']");
  if (homeLink) homeLink.href = "#modeHub";
  wireProfileNavigation();

  if (!moveProfileIntoSettings()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      wireProfileNavigation();
      if (moveProfileIntoSettings() || attempts > 80) clearInterval(timer);
    }, 50);
  }
}

declutterHub();

window.__footballLabHubV353 = Object.freeze({
  build: BUILD,
  home: "mode-mosaic-first",
  profile: "inside-settings",
  howToPlay: "inside-settings",
  hero: "removed-from-play-hub"
});
