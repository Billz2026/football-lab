import { processPlayerDynamics } from './player-dynamics-v062.js';

const SAVE_KEY = 'flm-career-save';
let dbPromise = null;
let lastSignature = '';
let busy = false;

const manager = () => window.FLMManager;
const loadDb = () => dbPromise ||= manager()?.loadDatabase?.();

function addTransferRequestNews(career, request) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  const key = `transfer-request-${request.playerId}-${career.roundIndex || 0}`;
  if (career.news.items.some(item => item.key === key)) return false;
  career.news.items.push({
    id: `news-${career.id}-${key}`,
    key,
    round: career.roundIndex || 0,
    period: 'AM',
    dateLabel: career.currentDate || '',
    category: 'Transfers',
    source: 'Player Liaison',
    title: `${request.playerName} asks to leave`,
    body: `${request.playerName} has submitted a transfer request. ${request.reason}. His squad role and future playing time now need managing.`,
    priority: 'important',
    order: 64000 + (career.roundIndex || 0),
    read: false,
    relatedPlayerId: request.playerId,
    relatedClubId: career.clubId
  });
  return true;
}

async function syncDynamics() {
  if (busy) return;
  const career = manager()?.activeCareer;
  if (!career?.id) { lastSignature = ''; return; }
  const signature = `${career.id}|${career.roundIndex || 0}|${career.currentDate || ''}`;
  if (signature === lastSignature) return;
  lastSignature = signature;
  busy = true;
  try {
    const db = await loadDb();
    if (!db) return;
    const result = processPlayerDynamics(career, db);
    if (!result.changed) return;
    result.requests.forEach(request => addTransferRequestNews(career, request));
    career.updatedAt = new Date().toISOString();
    if (localStorage.getItem('flm-autosave') !== 'false') localStorage.setItem(SAVE_KEY, JSON.stringify(career));
    document.dispatchEvent(new CustomEvent('flm:player-dynamics-updated', { detail: { requests: result.requests } }));
  } catch (error) {
    console.error('V0.6.2 player dynamics sync:', error);
  } finally {
    busy = false;
  }
}

setInterval(syncDynamics, 500);
document.addEventListener('flm:career-opened', syncDynamics);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncDynamics(); });
