import {
  acceptSellerCounter,
  ensureTransferState,
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getIncomingOffers,
  getPlayerContract,
  getTransferBudget,
  getTransferStance,
  getTransferWindowStatus,
  listOwnPlayersForTransfer,
  processTransferWorld,
  respondToIncomingOffer,
  searchTransferMarket,
  submitContractOffer,
  submitTransferOffer,
  toggleTransferListed
} from './transfers-v050.js?v=0.6.3';

const SAVE_KEY = 'flm-career-save';
let db = null;
let open = false;
let tab = 'Search';
let selectedId = null;
let queued = false;
let rendering = false;
let flash = null;

const filters = {
  query: '',
  position: 'All',
  club: 'All',
  age: 'All',
  contract: 'All',
  value: 'All',
  stance: 'All',
  sort: 'value-desc'
};

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const club = id => db?.clubs?.find(item => item.id === id) || null;
const player = id => db?.players?.find(item => item.id === id) || null;
const clubName = id => club(id)?.shortName || club(id)?.name || 'Unknown';
const compactMoney = value => {
  const n = Number(value || 0);
  if (n >= 1000000) return `£${(n / 1000000).toFixed(n >= 10000000 ? 1 : 2)}m`;
  return `£${Math.round(n / 1000)}k`;
};
const money = value => `£${Number(value || 0).toLocaleString('en-GB')}`;
const seasonStartYear = c => Number(String(c?.season || '2026/27').slice(0, 4)) || 2026;

function loadStyles() {
  if (document.getElementById('flm-transfers-cm-v1-style')) return;
  const link = document.createElement('link');
  link.id = 'flm-transfers-cm-v1-style';
  link.rel = 'stylesheet';
  link.href = './career-transfers-cm-v1.css?v=1.0.0';
  document.head.appendChild(link);
}

function persist(c) {
  if (!c || localStorage.getItem('flm-autosave') === 'false') return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

async function sync() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return null;
  db ||= await manager().loadDatabase();
  const stateChanged = ensureTransferState(c, db);
  const world = processTransferWorld(c, db);
  if (stateChanged || world.changed) persist(c);
  return { c, world };
}

async function ensureNav() {
  const nav = document.querySelector('.career-nav');
  const c = career();
  if (!nav || !c) return;
  await sync();
  let button = nav.querySelector('[data-cm-transfer-tab]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-nav-button cm-transfer-nav';
    button.dataset.cmTransferTab = '1';
    nav.querySelector('[data-career-tab="squad"]')?.after(button);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      document.querySelector('[data-career-tab="overview"]')?.click();
      open = true;
      queueMicrotask(() => renderTransfers(true));
    });
  }
  const pending = getIncomingOffers(c, { includeResolved: false }).length;
  const navMarkup = pending ? `Transfers<small>${pending} NEW</small>` : 'Transfers';
  if (button.innerHTML !== navMarkup) button.innerHTML = navMarkup;
  button.disabled = Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-active', open);
}

function contractInfo(c, p) {
  const contract = getPlayerContract(c, p);
  if (!contract) return { contract: null, years: null, label: 'Unknown', short: '—' };
  const years = Math.max(0, Number(contract.expiryYear) - seasonStartYear(c));
  const label = years <= 1 ? 'Expiring' : years === 2 ? '2 years' : `${years} years`;
  return { contract, years, label, short: `Jun ${contract.expiryYear}` };
}

function stanceInfo(c, p) {
  const stance = getTransferStance(p, db, c) || {};
  const tone = stance.tone || 'neutral';
  const group = tone === 'available' ? 'available' : tone === 'resistant' ? 'resistant' : 'negotiable';
  return { ...stance, tone, group, label: stance.label || 'Open to offers' };
}

function matchesAge(age, value) {
  const n = Number(age || 0);
  if (value === 'u21') return n > 0 && n <= 21;
  if (value === '22-25') return n >= 22 && n <= 25;
  if (value === '26-29') return n >= 26 && n <= 29;
  if (value === '30+') return n >= 30;
  return true;
}

function matchesValue(amount, value) {
  if (value === 'u10') return amount < 10000000;
  if (value === '10-25') return amount >= 10000000 && amount < 25000000;
  if (value === '25-50') return amount >= 25000000 && amount < 50000000;
  if (value === '50+') return amount >= 50000000;
  return true;
}

function filteredMarket(c) {
  let rows = searchTransferMarket(c, db, { query: filters.query, position: filters.position, clubId: filters.club });
  rows = rows.filter(p => {
    const value = estimatePlayerValue(p);
    const contract = contractInfo(c, p);
    const stance = stanceInfo(c, p);
    if (!matchesAge(p.reportedAge, filters.age)) return false;
    if (!matchesValue(value, filters.value)) return false;
    if (filters.contract === 'expiring' && !(contract.years !== null && contract.years <= 1)) return false;
    if (filters.contract === 'two' && !(contract.years !== null && contract.years <= 2)) return false;
    if (filters.contract === 'long' && !(contract.years !== null && contract.years >= 3)) return false;
    if (filters.stance !== 'All' && stance.group !== filters.stance) return false;
    return true;
  });
  const sorters = {
    'value-desc': (a,b) => estimatePlayerValue(b)-estimatePlayerValue(a) || a.name.localeCompare(b.name),
    'value-asc': (a,b) => estimatePlayerValue(a)-estimatePlayerValue(b) || a.name.localeCompare(b.name),
    'age-asc': (a,b) => Number(a.reportedAge||99)-Number(b.reportedAge||99) || a.name.localeCompare(b.name),
    'age-desc': (a,b) => Number(b.reportedAge||0)-Number(a.reportedAge||0) || a.name.localeCompare(b.name),
    'asking-asc': (a,b) => getAskingPrice(a,db,c)-getAskingPrice(b,db,c),
    'asking-desc': (a,b) => getAskingPrice(b,db,c)-getAskingPrice(a,db,c),
    'name-asc': (a,b) => a.name.localeCompare(b.name)
  };
  return rows.sort(sorters[filters.sort] || sorters['value-desc']);
}

function option(value, label, current) {
  return `<option value="${esc(value)}" ${String(current) === String(value) ? 'selected' : ''}>${esc(label)}</option>`;
}

function marketFilters(c, rows) {
  const clubs = [...new Map(searchTransferMarket(c, db, {}).map(p => [p.clubId, clubName(p.clubId)])).entries()]
    .sort((a,b) => a[1].localeCompare(b[1]));
  const active = Object.entries(filters).filter(([key,value]) => !['query','sort'].includes(key) && value !== 'All').length;
  return `<div class="cm-transfer-filterbar">
    <div class="cm-filter-search"><input type="search" value="${esc(filters.query)}" placeholder="Search player or position…" data-cm-filter="query" aria-label="Search players"></div>
    <select data-cm-filter="position">${['All','GK','DEF','MID','ATT'].map(v=>option(v,v==='All'?'All positions':v,filters.position)).join('')}</select>
    <select data-cm-filter="age">${option('All','Any age',filters.age)}${option('u21','21 or under',filters.age)}${option('22-25','Age 22–25',filters.age)}${option('26-29','Age 26–29',filters.age)}${option('30+','Age 30+',filters.age)}</select>
    <select data-cm-filter="contract">${option('All','Any contract',filters.contract)}${option('expiring','Expiring ≤1 yr',filters.contract)}${option('two','≤2 years left',filters.contract)}${option('long','3+ years left',filters.contract)}</select>
    <select data-cm-filter="value">${option('All','Any value',filters.value)}${option('u10','Under £10m',filters.value)}${option('10-25','£10m–£25m',filters.value)}${option('25-50','£25m–£50m',filters.value)}${option('50+','£50m+',filters.value)}</select>
    <select data-cm-filter="stance">${option('All','Any availability',filters.stance)}${option('available','Available',filters.stance)}${option('negotiable','Negotiable',filters.stance)}${option('resistant','Not for sale',filters.stance)}</select>
    <select data-cm-filter="club">${option('All','All clubs',filters.club)}${clubs.map(([id,name])=>option(id,name,filters.club)).join('')}</select>
    <select data-cm-filter="sort">${option('value-desc','Value ↓',filters.sort)}${option('value-asc','Value ↑',filters.sort)}${option('age-asc','Age ↑',filters.sort)}${option('age-desc','Age ↓',filters.sort)}${option('asking-asc','Asking ↑',filters.sort)}${option('asking-desc','Asking ↓',filters.sort)}${option('name-asc','Name A–Z',filters.sort)}</select>
    <button type="button" class="cm-filter-reset" data-cm-reset>RESET${active ? ` (${active})` : ''}</button>
    <span class="cm-result-count">${rows.length} players</span>
  </div>`;
}

function marketDetail(c, p) {
  if (!p) return `<div class="cm-transfer-empty"><strong>No player selected</strong><span>Select a row to view valuation and negotiate.</span></div>`;
  const window = getTransferWindowStatus(c);
  const asking = getAskingPrice(p, db, c);
  const value = estimatePlayerValue(p);
  const ci = contractInfo(c,p);
  const stance = stanceInfo(c,p);
  const negotiation = c.transfers.negotiations?.[p.id] || null;
  const status = negotiation?.status || 'idle';
  const latest = negotiation?.messages?.at(-1) || null;
  let action;
  if (!window.open) {
    action = `<div class="cm-deal-box is-closed"><div class="cm-deal-title">Registration closed</div><p>You can review targets, but permanent deals cannot currently be completed.</p></div>`;
  } else if (status === 'fee-accepted' || status === 'contract-countered') {
    const demand = negotiation.wageDemand || estimateWeeklyWage(p);
    action = `<div class="cm-deal-box"><div class="cm-deal-title">Personal terms</div><div class="cm-deal-controls"><input type="number" min="1000" step="500" value="${demand}" data-v050-wage><select data-v050-years><option>2</option><option>3</option><option selected>4</option><option>5</option></select><button data-v050-contract>OFFER CONTRACT</button></div>${latest ? `<p>${esc(latest)}</p>` : ''}</div>`;
  } else {
    const defaultFee = negotiation?.counterFee || asking;
    action = `<div class="cm-deal-box"><div class="cm-deal-title">Transfer offer</div><div class="cm-deal-controls"><input type="number" min="250000" step="250000" value="${defaultFee}" data-v050-fee><button data-v050-offer>MAKE OFFER</button></div><button class="cm-secondary-action" ${status==='countered'?'data-v050-counter':'data-v050-asking'}>${status==='countered'?`ACCEPT COUNTER · ${compactMoney(negotiation.counterFee)}`:`MEET ASKING PRICE · ${compactMoney(asking)}`}</button>${latest ? `<p>${esc(latest)}</p>` : ''}</div>`;
  }
  return `<div class="cm-player-card">
    <div class="cm-player-card-head"><div><span class="cm-kicker">RECRUITMENT REPORT</span><h3>${esc(p.name)}</h3><p>${esc(clubName(p.clubId))} · ${esc(p.primaryPosition || p.positionGroup || '—')} · Age ${esc(p.reportedAge || '—')}</p></div><span class="cm-stance is-${esc(stance.group)}">${esc(stance.label)}</span></div>
    <dl class="cm-player-facts"><div><dt>Value</dt><dd>${compactMoney(value)}</dd></div><div><dt>Asking</dt><dd>${compactMoney(asking)}</dd></div><div><dt>Contract</dt><dd>${esc(ci.short)}</dd></div><div><dt>Wage</dt><dd>${compactMoney(ci.contract?.weeklyWage || estimateWeeklyWage(p))}/wk</dd></div><div><dt>Ability</dt><dd>${Number(p.currentAbility||0)||'—'}</dd></div><div><dt>Potential</dt><dd>${Number(p.potentialAbility||0)||'—'}</dd></div></dl>
    ${action}
  </div>`;
}

function marketView(c) {
  const rows = filteredMarket(c);
  if (!rows.some(p => p.id === selectedId)) selectedId = rows[0]?.id || null;
  const selected = player(selectedId);
  const body = rows.slice(0,250).map(p => {
    const ci = contractInfo(c,p), stance = stanceInfo(c,p);
    return `<button type="button" class="cm-market-row ${p.id===selectedId?'is-selected':''}" data-v050-player="${esc(p.id)}">
      <span class="cm-cell cm-name"><strong>${esc(p.name)}</strong><small>${esc(p.secondaryPositions?.slice(0,2).join(', ') || '')}</small></span>
      <span class="cm-cell cm-pos">${esc(p.primaryPosition || p.positionGroup || '—')}</span>
      <span class="cm-cell cm-age">${esc(p.reportedAge || '—')}</span>
      <span class="cm-cell cm-club">${esc(clubName(p.clubId))}</span>
      <span class="cm-cell cm-contract"><strong>${esc(ci.short)}</strong><small class="${ci.years!==null&&ci.years<=1?'warn':''}">${esc(ci.label)}</small></span>
      <span class="cm-cell cm-value">${compactMoney(estimatePlayerValue(p))}</span>
      <span class="cm-cell cm-asking">${compactMoney(getAskingPrice(p,db,c))}</span>
      <span class="cm-cell cm-status"><i class="is-${esc(stance.group)}"></i>${esc(stance.group==='resistant'?'Not for sale':stance.group==='available'?'Available':'Negotiable')}</span>
    </button>`;
  }).join('');
  return `${marketFilters(c,rows)}<div class="cm-market-workspace"><section class="cm-market-table"><div class="cm-market-header"><span>Player</span><span>Pos</span><span>Age</span><span>Club</span><span>Contract</span><span>Value</span><span>Asking</span><span>Status</span></div><div class="cm-market-scroll">${body || '<div class="cm-transfer-empty"><strong>No matching players</strong><span>Broaden the recruitment filters.</span></div>'}</div></section><aside class="cm-market-detail">${marketDetail(c,selected)}</aside></div>`;
}

function negotiationsView(c) {
  const entries = Object.values(c.transfers.negotiations || {}).filter(item => item.status !== 'idle');
  if (!entries.length) return `<div class="cm-transfer-empty"><strong>No active negotiations</strong><span>Select a player from Search and submit an offer.</span></div>`;
  return `<div class="cm-list-table"><div class="cm-list-head"><span>Player</span><span>Club</span><span>Last bid</span><span>Status</span><span></span></div>${entries.map(item=>`<div class="cm-list-row"><span><strong>${esc(player(item.playerId)?.name||'Player')}</strong></span><span>${esc(clubName(item.sellingClubId))}</span><span>${compactMoney(item.lastOffer)}</span><span>${esc(String(item.status).replaceAll('-',' '))}</span><button data-v050-open-neg="${esc(item.playerId)}">OPEN</button></div>`).join('')}</div>`;
}

function offersView(c) {
  const offers = getIncomingOffers(c).sort((a,b)=>Number(b.status==='pending')-Number(a.status==='pending') || b.round-a.round);
  if (!offers.length) return `<div class="cm-transfer-empty"><strong>No offers received</strong><span>Transfer-listed players become more likely to attract bids.</span></div>`;
  return `<div class="cm-offer-list">${offers.map(offer=>{const p=player(offer.playerId),pending=offer.status==='pending',counter=Math.round((offer.offeredFee*1.1)/250000)*250000;return `<article class="cm-offer-row ${pending?'is-pending':''}"><div><strong>${esc(p?.name||'Player')}</strong><small>${esc(clubName(offer.buyerClubId))} · ${offer.listed?'Listed':'Unsolicited'}</small></div><b>${compactMoney(offer.offeredFee)}</b><span>${esc(offer.status.toUpperCase())}</span>${pending?`<div class="cm-offer-actions"><button data-v052-accept="${esc(offer.id)}">ACCEPT</button><input type="number" step="250000" min="250000" value="${counter}" data-v052-counter-fee="${esc(offer.id)}"><button data-v052-counter="${esc(offer.id)}">COUNTER</button><button class="danger" data-v052-reject="${esc(offer.id)}">REJECT</button></div>`:`<em>${offer.completedFee?`Completed ${compactMoney(offer.completedFee)}`:offer.counterFee?`Countered ${compactMoney(offer.counterFee)}`:'Resolved'}</em>`}</article>`;}).join('')}</div>`;
}

function worldView(c) {
  const deals=[...(c.transfers.completed||[])].filter(item=>item.source==='ai').reverse().slice(0,40);
  const rumours=[...(c.transfers.rumours||[])].reverse().slice(0,20);
  return `<div class="cm-world-grid"><section><header><strong>Completed deals</strong><span>Market activity</span></header>${deals.map(item=>`<div class="cm-world-row"><span><strong>${esc(player(item.playerId)?.name||'Player')}</strong><small>${esc(clubName(item.fromClubId))} → ${esc(clubName(item.toClubId))}</small></span><b>${compactMoney(item.fee)}</b></div>`).join('')||'<div class="cm-transfer-empty">No completed AI deals yet.</div>'}</section><section><header><strong>Rumours</strong><span>Unconfirmed</span></header>${rumours.map(item=>`<div class="cm-world-row"><span><strong>${esc(clubName(item.buyerClubId))}</strong><small>Tracking ${esc(player(item.playerId)?.name||'target')}</small></span><i>MONITORING</i></div>`).join('')||'<div class="cm-transfer-empty">No active rumours.</div>'}</section></div>`;
}

function squadView(c) {
  const listed=new Set(c.transfers.listedPlayerIds||[]);
  const rows=listOwnPlayersForTransfer(c,db);
  return `<div class="cm-list-table"><div class="cm-list-head squad"><span>Player</span><span>Pos</span><span>Age</span><span>Value</span><span>Contract</span><span>Status</span><span></span></div>${rows.map(p=>{const ci=contractInfo(c,p);return `<div class="cm-list-row squad"><span><strong>${esc(p.name)}</strong></span><span>${esc(p.primaryPosition||p.positionGroup||'—')}</span><span>${esc(p.reportedAge||'—')}</span><span>${compactMoney(estimatePlayerValue(p))}</span><span>${esc(ci.short)}</span><span>${listed.has(p.id)?'TRANSFER LISTED':'UNDER CONTRACT'}</span><button data-v050-list="${esc(p.id)}">${listed.has(p.id)?'REMOVE':'LIST'}</button></div>`;}).join('')}</div>`;
}

async function renderTransfers(force=false) {
  if (!open || rendering) return;
  const root=document.querySelector('.career-content');
  const synced=await sync();
  if(!root||!synced)return;
  if(!force&&root.dataset.cmTransfers==='1')return;
  rendering=true;
  const c=synced.c,budget=getTransferBudget(c),windowStatus=getTransferWindowStatus(c),pending=getIncomingOffers(c,{includeResolved:false}).length;
  document.querySelectorAll('.career-nav-button').forEach(button=>button.classList.remove('is-active'));
  document.querySelector('[data-cm-transfer-tab]')?.classList.add('is-active');
  root.dataset.cmTransfers='1'; delete root.dataset.v050Transfers;
  const tabs=[['Search','PLAYER SEARCH'],['Negotiations','NEGOTIATIONS'],['Offers',`OFFERS${pending?` · ${pending}`:''}`],['World','MARKET ACTIVITY'],['Squad','MY SQUAD']];
  root.innerHTML=`<section class="cm-transfer-page"><header class="cm-transfer-top"><div><span class="cm-kicker">RECRUITMENT & TRANSFERS</span><h2>Transfer Centre</h2></div><div class="cm-budget-strip"><div><small>Budget</small><strong>${compactMoney(budget.transferBudget)}</strong></div><div><small>Wage room</small><strong>${compactMoney(budget.wageRoom)}/wk</strong></div><div><small>Spent</small><strong>${compactMoney(budget.spent)}</strong></div><div class="window ${windowStatus.open?'open':'closed'}"><small>Window</small><strong>${windowStatus.deadlineWeek?`${Math.max(0,windowStatus.daysRemaining)} DAYS`:windowStatus.open?'OPEN':'CLOSED'}</strong></div></div></header><div class="cm-window-line"><strong>${esc(windowStatus.label)}</strong><span>${windowStatus.open?`${Math.max(0,windowStatus.daysRemaining)} days remaining`:'Scouting and shortlist review remain available'}</span></div>${flash?`<div class="cm-flash ${flash.good?'good':flash.bad?'bad':''}">${esc(flash.text)}</div>`:''}<nav class="cm-transfer-tabs">${tabs.map(([id,label])=>`<button class="${tab===id?'is-active':''}" data-cm-tab="${id}">${label}</button>`).join('')}</nav><div class="cm-transfer-body">${tab==='Search'?marketView(c):tab==='Negotiations'?negotiationsView(c):tab==='Offers'?offersView(c):tab==='World'?worldView(c):squadView(c)}</div></section>`;
  flash=null;

  root.querySelectorAll('[data-cm-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.cmTab;renderTransfers(true);}));
  root.querySelectorAll('[data-cm-filter]').forEach(control=>control.addEventListener(control.dataset.cmFilter==='query'?'input':'change',event=>{
    filters[control.dataset.cmFilter]=event.target.value; selectedId=null;
    const searchKey=control.dataset.cmFilter==='query'; const cursor=searchKey?event.target.selectionStart:null;
    renderTransfers(true).then(()=>{if(searchKey){const input=root.querySelector('[data-cm-filter="query"]');input?.focus();if(input&&cursor!==null)input.setSelectionRange(cursor,cursor);}});
  }));
  root.querySelector('[data-cm-reset]')?.addEventListener('click',()=>{Object.assign(filters,{query:'',position:'All',club:'All',age:'All',contract:'All',value:'All',stance:'All',sort:'value-desc'});selectedId=null;renderTransfers(true);});
  root.querySelectorAll('[data-v050-player]').forEach(btn=>btn.addEventListener('click',()=>{selectedId=btn.dataset.v050Player;renderTransfers(true);}));
  root.querySelector('[data-v050-asking]')?.addEventListener('click',()=>{const p=player(selectedId),input=root.querySelector('[data-v050-fee]');if(p&&input)input.value=String(getAskingPrice(p,db,c));});
  root.querySelector('[data-v050-offer]')?.addEventListener('click',()=>{try{const result=submitTransferOffer(c,db,selectedId,Number(root.querySelector('[data-v050-fee]').value));persist(c);flash={text:result.status==='accepted'?'Transfer fee accepted. Negotiate personal terms.':result.negotiation.messages.at(-1),good:result.status==='accepted',bad:result.status==='rejected'};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);});
  root.querySelector('[data-v050-counter]')?.addEventListener('click',()=>{try{acceptSellerCounter(c,db,selectedId);persist(c);flash={text:'Counter-offer accepted. Personal terms can now be negotiated.',good:true};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);});
  root.querySelector('[data-v050-contract]')?.addEventListener('click',()=>{try{const result=submitContractOffer(c,db,selectedId,Number(root.querySelector('[data-v050-wage]').value),Number(root.querySelector('[data-v050-years]').value));persist(c);if(result.status==='completed'){flash={text:`${player(result.transaction.playerId)?.name||'Player'} has signed for ${clubName(c.clubId)}.`,good:true};tab='Squad';selectedId=null;}else flash={text:result.negotiation.messages.at(-1),bad:true};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);});
  root.querySelectorAll('[data-v050-open-neg]').forEach(btn=>btn.addEventListener('click',()=>{selectedId=btn.dataset.v050OpenNeg;tab='Search';renderTransfers(true);}));
  root.querySelectorAll('[data-v050-list]').forEach(btn=>btn.addEventListener('click',()=>{try{const listed=toggleTransferListed(c,db,btn.dataset.v050List);persist(c);flash={text:listed?'Player added to transfer list.':'Player removed from transfer list.'};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);}));
  root.querySelectorAll('[data-v052-accept]').forEach(btn=>btn.addEventListener('click',()=>{try{const result=respondToIncomingOffer(c,db,btn.dataset.v052Accept,'accept');persist(c);tab='Squad';flash={text:`Offer accepted. ${player(result.transaction.playerId)?.name||'Player'} has been sold.`,good:true};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);}));
  root.querySelectorAll('[data-v052-reject]').forEach(btn=>btn.addEventListener('click',()=>{try{respondToIncomingOffer(c,db,btn.dataset.v052Reject,'reject');persist(c);flash={text:'Transfer offer rejected.'};}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);}));
  root.querySelectorAll('[data-v052-counter]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.v052Counter,input=root.querySelector(`[data-v052-counter-fee="${CSS.escape(id)}"]`);try{const result=respondToIncomingOffer(c,db,id,'counter',Number(input?.value));persist(c);flash=result.status==='completed'?{text:`Counter accepted. Player sold for ${compactMoney(result.transaction.fee)}.`,good:true}:{text:'Buying club rejected the counter-offer.',bad:true};if(result.status==='completed')tab='Squad';}catch(error){flash={text:error.message,bad:true};}renderTransfers(true);}));
  rendering=false;
}

async function scan(){queued=false;if(!window.FLMManager)return;loadStyles();await ensureNav();if(open)await renderTransfers();}
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>scan().catch(()=>{queued=false;rendering=false;}));
}
document.addEventListener('click',event=>{if(event.target.closest('[data-cm-transfer-tab]'))return;if(event.target.closest('.career-nav-button'))open=false;},true);
loadStyles();new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});queue();
