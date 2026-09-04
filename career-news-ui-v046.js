import {
  NEWS_CATEGORIES,
  getNewsItems,
  getUnreadNewsCount,
  markAllNewsRead,
  markNewsRead,
  syncCareerNews
} from './career-news-v046.js?v=0.4.6';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-career-news-v046-style';
let database = null;
let newsOpen = false;
let filter = 'All';
let selectedId = null;
let scanQueued = false;
let rendering = false;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function manager() { return window.FLMManager; }
function career() { return manager()?.activeCareer || null; }

function persist(c) {
  if (!c || localStorage.getItem('flm-autosave') === 'false') return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .version-chip{font-size:0!important}.version-chip::after{content:'V0.4.6';font-size:11px}.footer-build{font-size:0!important}.footer-build::after{content:'V0.4.6 · NEWS & INBOX';font-size:10px}
  .v046-news-nav{position:relative}.v046-news-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:7px;padding:0 5px;border-radius:999px;background:#e63f49;color:#fff;font-size:8px;font-weight:950}.v046-news-nav:disabled{opacity:.42;cursor:not-allowed}
  .v046-news-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;margin-bottom:12px}.v046-news-head h2{margin:3px 0 0}.v046-news-head-actions{display:flex;gap:7px}.v046-news-head-actions button{min-height:34px;padding:0 11px;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#141018;color:#eee4fa;font-size:8px;font-weight:900;cursor:pointer}.v046-news-head-actions button:first-child{border-color:#5c3b94;background:linear-gradient(#431b7e,#2b0d60)}
  .v046-news-tabs{display:grid;grid-template-columns:repeat(6,1fr);gap:2px;margin-bottom:9px}.v046-news-tabs button{min-height:40px;border:1px solid #50338b;border-radius:2px;background:linear-gradient(#421a82,#28095e);color:#d7caeb;font-size:8px;font-weight:950;cursor:pointer}.v046-news-tabs button.is-active{border-color:#f2d64e;color:#fff1a0;box-shadow:inset 0 0 0 1px #f2d64e55}
  .v046-news-layout{display:grid;grid-template-columns:minmax(300px,.82fr) minmax(0,1.45fr);min-height:560px;border:1px solid #49376c;background:radial-gradient(circle at 75% 55%,rgba(75,85,145,.16),transparent 28rem),linear-gradient(135deg,#080813,#120b18)}
  .v046-news-list{border-right:1px solid #49376c;background:#06060bbb;overflow:auto;max-height:620px}.v046-news-row{width:100%;display:grid;grid-template-columns:72px minmax(0,1fr) 10px;gap:8px;align-items:center;padding:10px 11px;border:0;border-bottom:1px solid #ffffff12;background:transparent;color:#d9d4df;text-align:left;cursor:pointer}.v046-news-row:hover{background:#ffffff08}.v046-news-row.is-selected{background:#7e0c17;color:#fff}.v046-news-row.is-unread strong{color:#fff;font-weight:950}.v046-news-date{padding:5px 4px;background:#123b91;color:#cbd9ff;text-align:center;font-size:8px;font-weight:900}.v046-news-row.is-selected .v046-news-date{background:#a5222e}.v046-news-copy{min-width:0}.v046-news-copy strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.v046-news-copy small{display:block;margin-top:3px;color:#968ea0;font-size:8px}.v046-news-row.is-selected .v046-news-copy small{color:#f1c9cd}.v046-unread-dot{width:7px;height:7px;border-radius:50%;background:#f2d64e}.v046-news-row:not(.is-unread) .v046-unread-dot{opacity:0}
  .v046-news-detail{position:relative;padding:26px 30px;overflow:auto;max-height:620px}.v046-news-detail:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 15%,rgba(255,255,255,.025),transparent 60%)}.v046-news-meta{display:flex;justify-content:space-between;gap:12px;padding-bottom:11px;border-bottom:1px solid #ffffff17;color:#8ea1b9;font-size:8px;font-weight:900;letter-spacing:.08em}.v046-news-category{color:#eadb53}.v046-news-detail h3{position:relative;margin:32px 0 16px;color:#ece04c;font-size:clamp(1.5rem,3vw,2.2rem)}.v046-news-detail p{position:relative;max-width:850px;margin:0;color:#ddd7df;font-size:14px;line-height:1.75}.v046-news-source{position:relative;margin-top:28px;padding-top:13px;border-top:1px solid #ffffff12;color:#968ea0;font-size:9px}.v046-news-related{position:relative;margin-top:14px}.v046-news-related button{min-height:34px;padding:0 12px;border:1px solid #5a4387;border-radius:6px;background:#271b39;color:#e8dff1;font-size:8px;font-weight:900;cursor:pointer}.v046-news-empty{display:grid;place-items:center;min-height:420px;padding:30px;text-align:center;color:#918a97}.v046-news-empty strong{display:block;color:#e2d94f;margin-bottom:8px}
  @media(max-width:960px){.v046-news-tabs{grid-template-columns:repeat(3,1fr)}.v046-news-layout{grid-template-columns:1fr}.v046-news-list{max-height:270px;border-right:0;border-bottom:1px solid #49376c}.v046-news-detail{max-height:none;min-height:350px}}
  @media(max-width:620px){.v046-news-head{align-items:flex-start;flex-direction:column}.v046-news-tabs{grid-template-columns:1fr 1fr}.v046-news-detail{padding:20px 17px}.v046-news-row{grid-template-columns:62px minmax(0,1fr) 8px}}
  `;
  document.head.appendChild(style);
}

async function sync() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return null;
  database ||= await manager().loadDatabase();
  if (syncCareerNews(c, database)) persist(c);
  return { c, db: database };
}

function updateNavBadge(button, c) {
  const count = getUnreadNewsCount(c);
  let badge = button.querySelector('.v046-news-badge');
  if (count && !badge) {
    badge = document.createElement('span');
    badge.className = 'v046-news-badge';
    button.appendChild(badge);
  }
  if (badge) {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }
}

async function ensureNav() {
  const nav = document.querySelector('.career-nav');
  const c = career();
  if (!nav || !c) return;
  await sync();
  let button = nav.querySelector('[data-v046-news-tab]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-nav-button v046-news-nav';
    button.dataset.v046NewsTab = '1';
    button.append(document.createTextNode('News'));
    const overview = nav.querySelector('[data-career-tab="overview"]');
    overview?.after(button);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      newsOpen = true;
      renderNews(true);
    });
  }
  button.disabled = Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-active', newsOpen);
  updateNavBadge(button, c);
}

function selectedItem(items) {
  let selected = items.find(item => item.id === selectedId);
  if (!selected) selected = items.find(item => !item.read) || items[0] || null;
  selectedId = selected?.id || null;
  return selected;
}

function detailHtml(item, db) {
  if (!item) return `<div class="v046-news-empty"><div><strong>NO STORIES IN THIS FILTER</strong><span>News will appear here when relevant career events occur.</span></div></div>`;
  const player = item.relatedPlayerId ? db.players.find(entry => entry.id === item.relatedPlayerId) : null;
  return `<div class="v046-news-meta"><span class="v046-news-category">${esc(item.category)}</span><span>${esc(item.dateLabel)} · ${esc(item.source)}</span></div>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.body)}</p>
    <div class="v046-news-source">SOURCE · ${esc(item.source)}${item.priority === 'important' ? ' · IMPORTANT' : ''}</div>
    ${player ? `<div class="v046-news-related"><button type="button" data-v046-player="${esc(player.id)}">OPEN ${esc(player.name.toUpperCase())} PROFILE</button></div>` : ''}`;
}

async function renderNews(force = false) {
  if (!newsOpen || rendering) return;
  const content = document.querySelector('.career-content');
  const synced = await sync();
  if (!content || !synced) return;
  if (!force && content.dataset.v046News === '1') return;
  rendering = true;
  const { c, db } = synced;
  const items = getNewsItems(c, filter);
  const selected = selectedItem(items);
  if (selected && markNewsRead(c, selected.id)) persist(c);

  document.querySelectorAll('.career-nav-button').forEach(button => button.classList.remove('is-active'));
  document.querySelector('[data-v046-news-tab]')?.classList.add('is-active');

  content.dataset.v046News = '1';
  content.innerHTML = `<div class="v046-news-head"><div><p class="eyebrow">MANAGER NEWS CENTRE</p><h2>News & Inbox</h2></div><div class="v046-news-head-actions"><button type="button" data-v046-next-unread>NEXT UNREAD</button><button type="button" data-v046-mark-all>MARK ALL READ</button></div></div>
    <div class="v046-news-tabs">${NEWS_CATEGORIES.map(category => `<button type="button" class="${category === filter ? 'is-active' : ''}" data-v046-filter="${esc(category)}">${esc(category)}${category !== 'All' && getUnreadNewsCount(c, category) ? ` · ${getUnreadNewsCount(c, category)}` : ''}</button>`).join('')}</div>
    <div class="v046-news-layout"><div class="v046-news-list">${items.length ? items.map(item => `<button type="button" class="v046-news-row ${item.id === selectedId ? 'is-selected' : ''} ${!item.read ? 'is-unread' : ''}" data-v046-news-item="${esc(item.id)}"><span class="v046-news-date">${esc(item.dateLabel)}</span><span class="v046-news-copy"><strong>${esc(item.title)}</strong><small>${esc(item.category)} · ${esc(item.source)}</small></span><i class="v046-unread-dot"></i></button>`).join('') : `<div class="v046-news-empty"><div><strong>NO ${esc(filter.toUpperCase())} STORIES</strong><span>The game will not invent transactions that have not happened in the career simulation.</span></div></div>`}</div><article class="v046-news-detail">${detailHtml(selected, db)}</article></div>`;

  content.querySelectorAll('[data-v046-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.v046Filter;
    selectedId = null;
    renderNews(true);
  }));
  content.querySelectorAll('[data-v046-news-item]').forEach(button => button.addEventListener('click', () => {
    selectedId = button.dataset.v046NewsItem;
    markNewsRead(c, selectedId);
    persist(c);
    renderNews(true);
  }));
  content.querySelector('[data-v046-mark-all]')?.addEventListener('click', () => {
    if (markAllNewsRead(c, filter)) persist(c);
    renderNews(true);
  });
  content.querySelector('[data-v046-next-unread]')?.addEventListener('click', () => {
    const unread = getNewsItems(c, filter).find(item => !item.read);
    if (!unread) return;
    selectedId = unread.id;
    markNewsRead(c, unread.id);
    persist(c);
    renderNews(true);
  });
  content.querySelector('[data-v046-player]')?.addEventListener('click', event => window.FLMPlayerProfile?.open(event.currentTarget.dataset.v046Player));

  const navButton = document.querySelector('[data-v046-news-tab]');
  if (navButton) updateNavBadge(navButton, c);
  rendering = false;
}

async function scan() {
  scanQueued = false;
  if (!window.FLMManager) return;
  injectStyles();
  await ensureNav();
  if (newsOpen) await renderNews();
}

function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  queueMicrotask(() => scan().catch(() => { scanQueued = false; }));
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-career-tab]')) newsOpen = false;
}, true);

injectStyles();
new MutationObserver(queueScan).observe(document.documentElement, { childList: true, subtree: true });
queueScan();
