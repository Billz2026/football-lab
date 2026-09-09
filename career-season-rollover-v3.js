import './career-season-rollover-v2.js';

let queued = false;

function syncRetirementPanel() {
  const career = window.FLMManager?.activeCareer || null;
  if (career?.careerLifecycle?.status !== 'retired') return;
  const content = document.querySelector('.career-content');
  if (!content) return;

  let panel = document.querySelector('.flm-rollover-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'flm-rollover-panel is-blocked';
    content.appendChild(panel);
  }
  const summary = career.careerSummary || {};
  const signature = `retired|${career.season}|${summary.matches || 0}|${summary.leagueTitles || 0}|${summary.hallOfFameScore || 0}`;
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  panel.className = 'flm-rollover-panel is-blocked';
  panel.innerHTML = `
    <div>
      <small>40-SEASON CAREER COMPLETE</small>
      <strong>${career.managerName || 'Manager'} retires after ${career.season}</strong>
      <p>${summary.seasonsCompleted || 40} seasons · ${summary.matches || 0} matches · ${summary.winPercentage || 0}% wins · ${summary.leagueTitles || 0} league titles · Hall of Fame ${summary.hallOfFameScore || 0}. No 41st season can be created.</p>
    </div>
    <button type="button" disabled>CAREER COMPLETE</button>
  `;
}

function queueSync() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    syncRetirementPanel();
  });
}

queueSync();
new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true });
