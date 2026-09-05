// Small completion guard for the V0.6.1 profile negotiation surface. The transfer core
// changes ownership before the profile overlay re-renders, so this keeps the successful
// deal visible rather than leaving the previous personal-terms form behind.

let scheduled = false;
let dbPromise = null;

function compactMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n >= 100_000_000 ? 0 : 1)}m`;
  return `£${Math.round(n / 1000)}k`;
}

async function reconcile() {
  const manager = window.FLMManager;
  const career = manager?.activeCareer;
  const playerId = window.FLMPlayerProfile?.activePlayerId;
  if (!career || !playerId) return;
  dbPromise ||= manager.loadDatabase?.();
  const db = await dbPromise;
  const player = db?.players?.find(item => item.id === playerId);
  if (!player) return;

  const ownPlayer = player.clubId === career.clubId || career.transfers?.ownership?.[playerId] === career.clubId;
  if (!ownPlayer) return;

  document.querySelector(`[data-v061-profile-bid="${CSS.escape(playerId)}"]`)?.remove();
  const shell = document.querySelector(`[data-v061-negotiation="${CSS.escape(playerId)}"]`);
  if (!shell || shell.dataset.v061Completed === '1') return;

  const transaction = [...(career.transfers?.completed || [])].reverse().find(item => item.playerId === playerId && item.toClubId === career.clubId);
  if (!transaction) return;
  shell.dataset.v061Completed = '1';
  const body = shell.querySelector('.v061-neg-body');
  if (!body) return;
  body.innerHTML = `
    <div class="v061-complete" style="margin:auto;max-width:560px">
      <strong>DEAL COMPLETED</strong>
      <p>${player.name} has joined your club for ${compactMoney(transaction.fee)} on a ${transaction.contractYears || career.transfers?.contracts?.[playerId]?.years || 4}-year contract.</p>
      <p>The transfer is complete and the player is immediately available in Squad and Tactics.</p>
    </div>`;
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    reconcile().catch(error => console.error('V0.6.1 negotiation completion guard:', error));
  });
}

const observer = new MutationObserver(schedule);
observer.observe(document.body, { childList: true, subtree: true });
schedule();
