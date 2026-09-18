// Football Lab Manager — appointment intro compatibility v1.
// Restores the intended announcement -> supporter reaction -> press flow while
// career-appointment-media-v066 remains authoritative for the press conference.
// No legacy appointment news items are recreated here.

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-appointment-intro-compat-v1-style';
const INTRO_CLASS = 'flm-appointment-intro-open';
let rendering = false;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function career() {
  return window.FLMManager?.activeCareer || null;
}

function modalParts() {
  const modal = document.getElementById('appModal');
  return {
    modal,
    card: modal?.querySelector('.modal-card') || null,
    eyebrow: document.getElementById('modalEyebrow'),
    title: document.getElementById('modalTitle'),
    copy: document.getElementById('modalCopy'),
    body: document.getElementById('modalBody'),
    actions: document.getElementById('modalActions')
  };
}

function persist(c) {
  if (!c) return;
  try {
    c.updatedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  } catch {}
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${INTRO_CLASS}{place-items:center!important;padding:clamp(16px,4vw,56px)!important}
    .${INTRO_CLASS} .modal-card{width:min(980px,100%)!important;max-width:980px!important;max-height:min(820px,calc(100vh - 32px))!important;overflow:auto!important;border:1px solid #2d6dbb!important;border-radius:3px!important;background:linear-gradient(145deg,rgba(5,25,49,.98),rgba(3,14,29,.99)),url('./assets/homepage/stadium-home.webp') center/cover no-repeat!important;box-shadow:0 28px 80px rgba(0,0,0,.55)!important}
    .${INTRO_CLASS} .modal-close{display:none!important}
    .${INTRO_CLASS} .modal-backdrop{pointer-events:none!important}
    .${INTRO_CLASS} #modalEyebrow{color:#8ee7a8!important}
    .${INTRO_CLASS} #modalTitle{color:#eef3f6!important}
    .${INTRO_CLASS} #modalCopy{color:#9caebe!important}
    .${INTRO_CLASS} #modalActions{display:none!important}
    .${INTRO_CLASS} .flm-appt-hero{border-color:#2d6dbb!important;background:rgba(7,28,56,.94)!important;box-shadow:inset 4px 0 #55dc7c}
    .${INTRO_CLASS} .flm-appt-reaction{grid-template-columns:minmax(180px,.72fr) minmax(0,1.5fr)!important}
    .${INTRO_CLASS} .flm-fan-score,.${INTRO_CLASS} .flm-appt-copy{border-color:#2d6dbb!important;background:rgba(7,28,56,.94)!important}
    .${INTRO_CLASS} .flm-appt-actions .primary{border-color:#f4c342!important;background:#f4c342!important;color:#071326!important}
    @media(max-width:700px){.${INTRO_CLASS} .flm-appt-reaction{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
}

function appointmentState(c = career()) {
  const state = c?.appointmentExperience;
  if (!c?.managerProfile?.schemaVersion || !state || state.completed || state.dismissed || state.legacySkipped) return null;
  if ((Number(state.questionIndex) || 0) !== 0) return null;
  if (Array.isArray(state.answers) && state.answers.length) return null;
  return state;
}

function supporterLabel(score) {
  const value = Number(score) || 0;
  if (value >= 78) return 'Excited';
  if (value >= 64) return 'Positive';
  if (value >= 50) return 'Cautiously optimistic';
  if (value >= 36) return 'Divided';
  return 'Sceptical';
}

function relationSummary(c) {
  const values = Object.values(c?.playerRelationships || {})
    .map(item => Number(item?.managerRespect))
    .filter(Number.isFinite);
  return {
    sceptical: values.filter(value => value < 40).length,
    supportive: values.filter(value => value >= 65).length
  };
}

function clubName(c) {
  const heading = document.querySelector('.career-header-club strong,.career-shell-club strong,[data-shell-club-name]');
  return heading?.textContent?.trim() || c?.clubName || 'the club';
}

function openIntroFrame() {
  const parts = modalParts();
  if (!parts.modal || !parts.body) return null;

  // Never steal a legitimate modal owned by another system.
  if (parts.modal.classList.contains('is-open') && !parts.modal.classList.contains(INTRO_CLASS)) return null;

  ensureStyles();
  parts.modal.classList.remove('flm-appointment-open', 'club-picker-modal', 'flm-profile-v2-open');
  parts.modal.classList.add('is-open', INTRO_CLASS);
  parts.modal.setAttribute('aria-hidden', 'false');
  parts.card?.classList.add('modal-wide');
  parts.actions?.replaceChildren();
  document.body.style.overflow = 'hidden';
  return parts;
}

function closeIntroFrame() {
  const parts = modalParts();
  if (!parts.modal?.classList.contains(INTRO_CLASS)) return;
  parts.modal.classList.remove('is-open', INTRO_CLASS);
  parts.modal.setAttribute('aria-hidden', 'true');
  parts.card?.classList.remove('modal-wide');
  document.body.style.overflow = document.querySelector('.career-app.is-open') ? 'hidden' : '';
}

function renderAnnouncement(c, state) {
  const parts = openIntroFrame();
  if (!parts) return false;
  rendering = true;
  const club = clubName(c);
  const profile = c.managerProfile || {};
  parts.eyebrow.textContent = 'NEW CAREER · CLUB ANNOUNCEMENT';
  parts.title.textContent = 'YOU HAVE BEEN APPOINTED';
  parts.copy.textContent = 'Your career begins with the public reaction to your appointment.';
  parts.body.innerHTML = `<div class="flm-appointment" data-appointment-v066="announcement"><section class="flm-appt-hero"><div class="flm-appt-kicker">OFFICIAL CLUB ANNOUNCEMENT</div><h3>${esc(profile.name || c.managerName || 'New Manager')}</h3><p>${esc(club)} have confirmed ${esc(profile.name || c.managerName || 'their new manager')} as their new manager.</p><div class="flm-appt-badges"><span class="flm-appt-badge">NATIONALITY · <strong>${esc(profile.nationality || '—')}</strong></span><span class="flm-appt-badge">BACKGROUND · <strong>${esc(profile.experienceLabel || 'Manager')}</strong></span><span class="flm-appt-badge">REPUTATION · <strong>${Math.round(Number(c.managerReputation) || 0)}/100</strong></span></div></section><div class="flm-appt-actions"><button class="primary" type="button" data-appt-fans>VIEW FAN REACTION</button></div></div>`;
  parts.body.querySelector('[data-appt-fans]')?.addEventListener('click', () => {
    state.stage = 'fans';
    persist(c);
    renderFans(c, state);
  });
  rendering = false;
  return true;
}

function renderFans(c, state) {
  const parts = openIntroFrame();
  if (!parts) return false;
  rendering = true;
  const score = Math.max(0, Math.min(100, Math.round(Number(state.fanSentiment) || 50)));
  const relations = relationSummary(c);
  const label = supporterLabel(score);
  parts.eyebrow.textContent = 'NEW CAREER · SUPPORTER REACTION';
  parts.title.textContent = 'THE FIRST VERDICT';
  parts.copy.textContent = 'Supporter mood sets the early pressure around your appointment. The dressing room is watching too.';
  parts.body.innerHTML = `<div class="flm-appointment" data-appointment-v066="fans"><div class="flm-appt-reaction"><section class="flm-fan-score"><small>FAN SENTIMENT</small><strong>${esc(label)}</strong><span>${score}/100</span><div class="flm-appt-meter" style="--fan-score:${score}%"><span></span></div></section><section class="flm-appt-copy"><small>SUPPORTER REACTION</small><p>The early supporter response to ${esc(c.managerProfile?.name || c.managerName || 'the new manager')} is ${esc(label.toLowerCase())}. Results and media handling can move that mood quickly.</p><p>${relations.sceptical} squad player${relations.sceptical === 1 ? ' is' : 's are'} currently sceptical, while ${relations.supportive} already show strong support.</p></section></div><div class="flm-appt-actions"><button class="primary" type="button" data-appt-media>FACE THE MEDIA</button></div></div>`;
  parts.body.querySelector('[data-appt-media]')?.addEventListener('click', () => {
    state.stage = 'press';
    state.introSeen = true;
    persist(c);
    closeIntroFrame();
    document.body.dispatchEvent(new CustomEvent('flm:appointment-intro-complete', { bubbles: true }));
  });
  rendering = false;
  return true;
}

function reconcile() {
  if (rendering) return;
  const c = career();
  const state = appointmentState(c);
  if (!state || !document.querySelector('.career-app.is-open')) {
    if (!state) closeIntroFrame();
    return;
  }

  // V0.6.9 currently initialises directly to press. Convert only untouched new
  // appointments; once the intro has been completed, stage=press is legitimate.
  if (state.stage === 'press' && !state.introSeen) {
    state.stage = 'announcement';
    state.introSeen = true;
    persist(c);
  }

  if (state.stage === 'announcement') renderAnnouncement(c, state);
  else if (state.stage === 'fans') renderFans(c, state);
}

const observer = new MutationObserver(() => queueMicrotask(reconcile));
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

['flm:career-opened', 'flm:career-created', 'flm:career-data-refresh'].forEach(name => {
  document.addEventListener(name, reconcile);
});

document.addEventListener('click', event => {
  if (event.target?.closest?.('[data-start-club], [data-action="new-game"]')) {
    setTimeout(reconcile, 0);
    setTimeout(reconcile, 40);
    setTimeout(reconcile, 100);
  }
}, true);

setInterval(reconcile, 60);
reconcile();

window.FLMAppointmentIntroCompatV1 = Object.freeze({ version: 1, reconcile });
