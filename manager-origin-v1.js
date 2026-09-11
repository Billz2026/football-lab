/* Football Lab Manager — manager origin selection v1
 * Adds an accessible manager-background step before the existing club picker.
 * Origin data is persisted inside the canonical flm-career-save object.
 */

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-manager-origin-v1-style';

const ORIGINS = Object.freeze([
  {
    id: 'tactical-specialist',
    label: 'Tactical Specialist',
    kicker: 'COACHING PATHWAY',
    summary: 'You built your reputation on structure, preparation and getting a team comfortable in your system.',
    impact: 'Small boost to tactical familiarity and cohesion; slightly less emphasis on recruitment instinct.',
    modifiers: { tacticalFamiliarity: 1.03, manManagement: 1.00, youthDevelopment: 1.00, recruitmentInsight: 0.99, boardTrust: 1.00 }
  },
  {
    id: 'club-builder',
    label: 'Club Builder',
    kicker: 'LONG-TERM PROJECT',
    summary: 'You are strongest when setting standards, earning board confidence and building a stable long-term project.',
    impact: 'Small boost to board trust and long-term stability; slightly less immediate tactical familiarity.',
    modifiers: { tacticalFamiliarity: 0.99, manManagement: 1.00, youthDevelopment: 1.01, recruitmentInsight: 1.00, boardTrust: 1.03 }
  },
  {
    id: 'man-manager',
    label: 'Man Manager',
    kicker: 'PEOPLE FIRST',
    summary: 'You are strongest at reading personalities, maintaining morale and keeping the dressing room together.',
    impact: 'Small boost to morale and relationships; slightly less tactical familiarity.',
    modifiers: { tacticalFamiliarity: 0.99, manManagement: 1.03, youthDevelopment: 1.00, recruitmentInsight: 1.00, boardTrust: 1.00 }
  },
  {
    id: 'youth-developer',
    label: 'Youth Developer',
    kicker: 'BUILD FOR TOMORROW',
    summary: 'You trust development, minutes and patience to turn high-potential players into first-team assets.',
    impact: 'Small boost to youth development and patience outcomes; slightly less immediate recruitment certainty.',
    modifiers: { tacticalFamiliarity: 1.00, manManagement: 1.00, youthDevelopment: 1.03, recruitmentInsight: 0.99, boardTrust: 1.01 }
  },
  {
    id: 'recruitment-expert',
    label: 'Recruitment Expert',
    kicker: 'MARKET SPECIALIST',
    summary: 'You built your name by identifying squad needs, judging fit and finding value in the market.',
    impact: 'Small boost to transfer fit and scouting confidence; slightly less player-development influence.',
    modifiers: { tacticalFamiliarity: 1.00, manManagement: 1.00, youthDevelopment: 0.99, recruitmentInsight: 1.03, boardTrust: 1.00 }
  }
]);

let pendingOrigin = null;
let pendingPreviousCareerId = null;
let bypassNewGameIntercept = false;
let careerWatchTimer = null;

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .modal.manager-origin-modal .modal-card{width:min(1100px,100%);max-height:min(900px,calc(100dvh - 28px));overflow:auto;background:linear-gradient(145deg,#071a34,#041025 70%);border-color:rgba(47,104,169,.7)}
    .modal.manager-origin-modal .modal-copy{color:#aebdca}
    .manager-origin-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.55fr);gap:16px;align-items:start}
    .manager-origin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .manager-origin-card{position:relative;display:grid;gap:7px;min-height:142px;padding:14px 15px;border:1px solid rgba(47,104,169,.62);background:rgba(5,22,45,.9);cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease,box-shadow .16s ease}
    .manager-origin-card:hover,.manager-origin-card:focus-within{border-color:#55dc7c;background:#0b315c;box-shadow:inset 4px 0 #55dc7c;transform:translateX(2px)}
    .manager-origin-card.is-selected{border-color:#55dc7c;background:#174d36;box-shadow:inset 4px 0 #55dc7c}
    .manager-origin-card input{position:absolute;top:14px;right:14px;width:18px;height:18px;accent-color:#55dc7c}
    .manager-origin-card small{padding-right:28px;color:#8ee7a8;font-size:8px;font-weight:950;letter-spacing:.13em}
    .manager-origin-card strong{color:#f4c342;font-size:15px;letter-spacing:.02em}
    .manager-origin-card span{color:#d6e0e7;font-size:10px;line-height:1.55}
    .manager-origin-card em{margin-top:auto;color:#8fa9bd;font-size:9px;font-style:normal;line-height:1.45}
    .manager-origin-impact{position:sticky;top:0;padding:16px;border:1px solid rgba(47,104,169,.62);background:rgba(3,17,37,.96)}
    .manager-origin-impact>small{display:block;color:#8fa9bd;font-size:8px;font-weight:950;letter-spacing:.15em}
    .manager-origin-impact h3{margin:6px 0 8px;color:#f1f5f7;font-size:19px}
    .manager-origin-impact p{margin:0 0 12px;color:#aebdca;font-size:10px;line-height:1.55}
    .manager-origin-bars{display:grid;gap:8px}
    .manager-origin-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid rgba(47,104,169,.42);background:#071a34}
    .manager-origin-bar span{color:#c8d5df;font-size:9px;font-weight:850}.manager-origin-bar b{color:#f4c342;font-size:9px}
    .manager-origin-note{margin-top:12px;padding-top:10px;border-top:1px solid rgba(47,104,169,.38);color:#8fa9bd;font-size:8px;line-height:1.5}
    .modal.manager-origin-modal .modal-actions button:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(1)}
    @media(max-width:820px){.manager-origin-layout{grid-template-columns:1fr}.manager-origin-impact{position:static}.manager-origin-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.modal.manager-origin-modal .modal-card{padding:18px}.manager-origin-grid{grid-template-columns:1fr}.manager-origin-card{min-height:126px}.manager-origin-layout{gap:11px}}
  `;
  document.head.appendChild(style);
}

function modalParts() {
  const modal = document.getElementById('appModal');
  if (!modal) return null;
  return {
    modal,
    card: modal.querySelector('.modal-card'),
    eyebrow: document.getElementById('modalEyebrow'),
    title: document.getElementById('modalTitle'),
    copy: document.getElementById('modalCopy'),
    body: document.getElementById('modalBody'),
    actions: document.getElementById('modalActions')
  };
}

function closeOriginModal() {
  const parts = modalParts();
  if (!parts) return;
  parts.modal.classList.remove('is-open', 'manager-origin-modal');
  parts.modal.setAttribute('aria-hidden', 'true');
  parts.card?.classList.remove('modal-wide');
  document.body.style.overflow = '';
}

function impactMarkup(origin) {
  if (!origin) {
    return '<small>CAREER IMPACT</small><h3>Choose your background</h3><p>Select an origin to preview its five career modifiers. Effects are deliberately small so there is no dominant choice.</p>';
  }
  const labels = {
    tacticalFamiliarity: 'Tactical familiarity',
    manManagement: 'Man management',
    youthDevelopment: 'Youth development',
    recruitmentInsight: 'Recruitment insight',
    boardTrust: 'Board trust'
  };
  const bars = Object.entries(origin.modifiers).map(([key, value]) => {
    const delta = Math.round((value - 1) * 100);
    const display = delta === 0 ? 'BASE' : `${delta > 0 ? '+' : ''}${delta}%`;
    return `<div class="manager-origin-bar"><span>${esc(labels[key])}</span><b>${display}</b></div>`;
  }).join('');
  return `<small>CAREER IMPACT</small><h3>${esc(origin.label)}</h3><p>${esc(origin.impact)}</p><div class="manager-origin-bars">${bars}</div><div class="manager-origin-note">These modifiers are stored in the normal career save and are intentionally capped to small identity-level nudges.</div>`;
}

function showOriginModal() {
  injectStyles();
  const parts = modalParts();
  if (!parts) return;
  let selectedId = null;

  parts.eyebrow.textContent = '01 · NEW CAREER';
  parts.title.textContent = 'CHOOSE YOUR MANAGER ORIGIN';
  parts.copy.textContent = 'Your background shapes how you begin the job. Pick the identity that matches how you want to manage.';
  parts.body.innerHTML = `
    <div class="manager-origin-layout">
      <div class="manager-origin-grid" role="radiogroup" aria-label="Manager origin">
        ${ORIGINS.map(origin => `<label class="manager-origin-card" data-origin-card="${esc(origin.id)}"><input type="radio" name="manager-origin" value="${esc(origin.id)}"><small>${esc(origin.kicker)}</small><strong>${esc(origin.label)}</strong><span>${esc(origin.summary)}</span><em>${esc(origin.impact)}</em></label>`).join('')}
      </div>
      <aside class="manager-origin-impact" data-origin-impact aria-live="polite">${impactMarkup(null)}</aside>
    </div>`;
  parts.actions.replaceChildren();

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'CANCEL';
  cancel.addEventListener('click', () => {
    pendingOrigin = null;
    pendingPreviousCareerId = null;
    stopCareerWatch();
    closeOriginModal();
  });

  const continueButton = document.createElement('button');
  continueButton.type = 'button';
  continueButton.className = 'action-gold';
  continueButton.textContent = 'CONTINUE';
  continueButton.disabled = true;
  continueButton.addEventListener('click', () => {
    const origin = ORIGINS.find(item => item.id === selectedId);
    if (!origin) return;
    pendingOrigin = origin;
    pendingPreviousCareerId = window.FLMManager?.activeCareer?.id || null;
    parts.modal.classList.remove('manager-origin-modal');
    bypassNewGameIntercept = true;
    const trigger = document.querySelector('[data-action="new-game"]');
    if (trigger) trigger.click();
    bypassNewGameIntercept = false;
    watchForCreatedCareer();
  });

  parts.actions.append(cancel, continueButton);
  parts.card?.classList.add('modal-wide');
  parts.modal.classList.remove('club-picker-modal');
  parts.modal.classList.add('is-open', 'manager-origin-modal');
  parts.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const impact = parts.body.querySelector('[data-origin-impact]');
  parts.body.querySelectorAll('input[name="manager-origin"]').forEach(input => {
    input.addEventListener('change', () => {
      selectedId = input.value;
      const origin = ORIGINS.find(item => item.id === selectedId);
      parts.body.querySelectorAll('[data-origin-card]').forEach(card => card.classList.toggle('is-selected', card.dataset.originCard === selectedId));
      impact.innerHTML = impactMarkup(origin);
      continueButton.disabled = false;
    });
  });
  parts.body.querySelector('input[name="manager-origin"]')?.focus();
}

function persistCareer(career) {
  if (!career) return;
  career.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(career));
}

function applyOriginToCareer(career, origin) {
  if (!career || !origin || career.managerOrigin?.id === origin.id) return false;
  career.managerOrigin = {
    id: origin.id,
    label: origin.label,
    summary: origin.summary,
    impact: origin.impact
  };
  career.managerModifiers = { ...origin.modifiers };
  persistCareer(career);
  return true;
}

function stopCareerWatch() {
  if (careerWatchTimer) clearInterval(careerWatchTimer);
  careerWatchTimer = null;
}

function watchForCreatedCareer() {
  stopCareerWatch();
  if (!pendingOrigin) return;
  const startedAt = Date.now();
  careerWatchTimer = setInterval(() => {
    const career = window.FLMManager?.activeCareer;
    if (career && career.id !== pendingPreviousCareerId && !career.managerOrigin && career.status === 'active') {
      applyOriginToCareer(career, pendingOrigin);
      pendingOrigin = null;
      pendingPreviousCareerId = null;
      stopCareerWatch();
      return;
    }
    if (Date.now() - startedAt > 60000) {
      pendingOrigin = null;
      pendingPreviousCareerId = null;
      stopCareerWatch();
    }
  }, 80);
}

document.addEventListener('click', event => {
  const action = event.target.closest?.('[data-action]')?.dataset.action;
  if (action === 'quick-start') { pendingOrigin = null; pendingPreviousCareerId = null; }
  if (action !== 'new-game' || bypassNewGameIntercept) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  pendingOrigin = null;
  pendingPreviousCareerId = null;
  showOriginModal();
}, true);

document.addEventListener('click', event => {
  const parts = modalParts();
  if (!parts) return;
  const closeTarget = event.target.closest?.('[data-close-modal]');
  const button = event.target.closest?.('button');

  if (parts.modal.classList.contains('manager-origin-modal') && closeTarget) {
    pendingOrigin = null;
    pendingPreviousCareerId = null;
    stopCareerWatch();
    parts.modal.classList.remove('manager-origin-modal');
    return;
  }

  if (!pendingOrigin || !parts.modal.classList.contains('club-picker-modal')) return;
  if (closeTarget || button?.textContent.trim().toUpperCase() === 'CANCEL') {
    pendingOrigin = null;
    pendingPreviousCareerId = null;
    stopCareerWatch();
  }
}, true);

injectStyles();
