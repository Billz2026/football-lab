/* Football Lab Manager — transfer market filters v2
 * Click-first recruitment filtering layered over the stable transfer UI.
 */
import {
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getPlayerContract,
  getTransferBudget,
  searchTransferMarket
} from './transfers-v050.js?v=0.6.2';

(() => {
  'use strict';

  const VERSION = '2.0.0';
  const STYLE_ID = 'flm-transfer-filters-v2-style';
  let db = null;
  let dbPromise = null;
  let frame = 0;
  let selectedId = null;
  let advanced = false;
  const filters = {
    age:'any', value:'any', contract:'any', wage:'any', club:'all', nationality:'all',
    sort:'value-desc', affordable:false, expiring:false, u23:false
  };

  const manager = () => window.FLMManager;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clubName = id => db?.clubs?.find(item => item.id === id)?.name || 'Unknown club';
  const money = value => {
    const n = Number(value || 0);
    return n >= 1000000 ? `£${(n/1000000).toFixed(n >= 10000000 ? 1 : 2)}m` : `£${Math.round(n/1000)}k`;
  };

  function loadDb(){
    if (db) return Promise.resolve(db);
    if (!dbPromise && manager()?.loadDatabase) dbPromise = Promise.resolve(manager().loadDatabase()).then(value => (db=value)).catch(()=>null);
    return dbPromise || Promise.resolve(null);
  }

  function styles(){
    if (document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .flm-cm-shell .career-content:has(.v050-transfer-page){padding:12px 14px 14px!important;overflow:hidden!important}
      .flm-cm-shell .career-content .v050-transfer-page{width:100%!important;max-width:none!important;margin:0!important;min-height:0!important}
      .flm-cm-shell .career-content .v050-market-layout{height:calc(100dvh - 332px)!important;min-height:520px!important;max-height:none!important;grid-template-columns:minmax(390px,40%) minmax(0,60%)!important}
      .flm-cm-shell .career-content .v050-detail{padding:18px 20px!important}
      .v057-tools{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}
      .v057-primary{display:grid;grid-template-columns:minmax(260px,1fr) 118px 160px 112px;gap:6px;align-items:center}
      .v057-primary select,.v057-primary button,.v057-more select,.v057-reset{min-height:36px;border:1px solid rgba(61,119,169,.35);border-radius:5px;background:#061d34;color:#eef5f9;padding:0 9px;font:800 9px/1 Inter,system-ui,sans-serif;outline:none}
      .v057-primary select:focus,.v057-more select:focus{border-color:#47b7f3;box-shadow:0 0 0 2px rgba(71,183,243,.12)}
      .v057-toggle{cursor:pointer;color:#c9dfed!important}.v057-toggle.is-active{border-color:#47b7f3!important;background:#0b3153!important;color:#fff!important}
      .v057-quick{display:flex;gap:5px;align-items:center;min-height:30px;flex-wrap:wrap}
      .v057-chip{min-height:27px;padding:0 9px;border:1px solid rgba(61,119,169,.3);border-radius:4px;background:#06182c;color:#8eabc1;font:900 8px/1 Inter,system-ui,sans-serif;cursor:pointer}
      .v057-chip:hover{border-color:#47b7f3;color:#fff}.v057-chip.is-active{border-color:#55dc7c;background:#174d36;color:#eaffef}
      .v057-summary{margin-left:auto;color:#6689a6;font:800 8px/1 Inter,system-ui,sans-serif}
      .v057-more{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:6px;padding:7px;border:1px solid rgba(61,119,169,.25);border-radius:6px;background:rgba(4,20,38,.7)}
      .v057-more[hidden]{display:none!important}.v057-field{display:grid;gap:4px}.v057-field span{color:#7897af;font:900 7px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .v057-reset{align-self:end;cursor:pointer;background:#082640!important;color:#cfe4f2!important}
      .v057-budget{display:inline-flex;align-items:center;min-height:22px;margin-top:7px;padding:0 8px;border:1px solid rgba(255,107,107,.4);border-radius:4px;background:rgba(255,107,107,.08);color:#ff9c9c;font:900 7px/1 Inter,system-ui,sans-serif;letter-spacing:.07em}.v057-budget.good{border-color:rgba(85,220,124,.35);background:rgba(85,220,124,.07);color:#75e699}
      @media(max-width:1180px){.v057-primary{grid-template-columns:minmax(220px,1fr) 105px 135px 100px}.v057-more{grid-template-columns:repeat(3,minmax(120px,1fr))}.flm-cm-shell .career-content .v050-market-layout{grid-template-columns:minmax(330px,42%) minmax(0,58%)!important}}
      @media(max-width:820px){.flm-cm-shell .career-content:has(.v050-transfer-page){overflow:auto!important}.flm-cm-shell .career-content .v050-market-layout{height:auto!important;min-height:0!important;grid-template-columns:1fr!important}.v057-primary{grid-template-columns:1fr 1fr}.v057-primary .v050-search-wrap{grid-column:1/-1}.v057-more{grid-template-columns:repeat(2,minmax(0,1fr))}.v057-summary{width:100%;margin:3px 0 0}.v050-player-list{max-height:390px}.v050-detail{min-height:420px}}
      @media(max-width:520px){.v057-primary{grid-template-columns:1fr}.v057-primary .v050-search-wrap{grid-column:auto}.v057-more{grid-template-columns:1fr}.v057-quick{display:grid;grid-template-columns:1fr 1fr}.v057-chip{min-height:34px}}
    `;
    document.head.appendChild(s);
  }

  const startYear = c => Number(String(c?.season || '2026/27').match(/20\d{2}/)?.[0] || 2026);
  const nationality = p => String(p?.nationality || p?.nationalityCode || '').trim();
  const query = () => document.querySelector('[data-v050-search]')?.value || '';
  const position = () => document.querySelector('[data-v050-position]')?.value || 'All';

  function ageOk(age,key){const n=Number(age);if(!Number.isFinite(n))return key==='any';if(key==='u21')return n<=21;if(key==='u23')return n<=23;if(key==='24-28')return n>=24&&n<=28;if(key==='29-32')return n>=29&&n<=32;if(key==='33+')return n>=33;return true}
  function valueOk(value,key){const m=Number(value)/1e6;if(key==='0-5')return m<=5;if(key==='5-15')return m>5&&m<=15;if(key==='15-30')return m>15&&m<=30;if(key==='30-60')return m>30&&m<=60;if(key==='60+')return m>60;return true}
  function wageOk(value,key){const k=Number(value)/1000;if(key==='25')return k<=25;if(key==='50')return k<=50;if(key==='100')return k<=100;if(key==='200')return k<=200;if(key==='200+')return k>200;return true}
  function contractOk(expiry,key,year){const e=Number(expiry);if(!Number.isFinite(e))return key==='any';if(key==='1')return e<=year+1;if(key==='2')return e<=year+2;if(key==='3+')return e>=year+3;return true}

  function market(c){
    const year=startYear(c), budget=getTransferBudget(c);
    const rows=searchTransferMarket(c,db,{query:query(),position:position()}).filter(p=>{
      const age=Number(p.reportedAge), value=estimatePlayerValue(p), contract=getPlayerContract(c,p), wage=Number(contract?.weeklyWage||estimateWeeklyWage(p)), asking=getAskingPrice(p,db,c);
      if(!ageOk(age,filters.age)||!valueOk(value,filters.value)||!contractOk(contract?.expiryYear,filters.contract,year)||!wageOk(wage,filters.wage))return false;
      if(filters.club!=='all'&&p.clubId!==filters.club)return false;
      if(filters.nationality!=='all'&&nationality(p)!==filters.nationality)return false;
      if(filters.affordable&&(asking>budget.transferBudget||wage>budget.wageRoom))return false;
      if(filters.expiring&&Number(contract?.expiryYear||9999)>year+1)return false;
      if(filters.u23&&(!Number.isFinite(age)||age>23))return false;
      return true;
    });
    const data=p=>({value:estimatePlayerValue(p),age:Number(p.reportedAge||99),wage:Number(getPlayerContract(c,p)?.weeklyWage||estimateWeeklyWage(p)),contract:Number(getPlayerContract(c,p)?.expiryYear||9999),name:String(p.name||'')});
    rows.sort((a,b)=>{const A=data(a),B=data(b);switch(filters.sort){case'value-asc':return A.value-B.value||A.name.localeCompare(B.name);case'age-asc':return A.age-B.age||B.value-A.value;case'age-desc':return B.age-A.age||B.value-A.value;case'contract':return A.contract-B.contract||B.value-A.value;case'wage-asc':return A.wage-B.wage||B.value-A.value;case'name':return A.name.localeCompare(B.name);default:return B.value-A.value||A.name.localeCompare(B.name)}});
    return rows;
  }

  function options(c){
    const all=searchTransferMarket(c,db,{query:'',position:'All'});
    const clubs=[...new Set(all.map(p=>p.clubId).filter(Boolean))].sort((a,b)=>clubName(a).localeCompare(clubName(b)));
    const nations=[...new Set(all.map(nationality).filter(Boolean))].sort();
    return {
      clubs:`<option value="all">All clubs</option>${clubs.map(id=>`<option value="${esc(id)}" ${filters.club===id?'selected':''}>${esc(clubName(id))}</option>`).join('')}`,
      nations:`<option value="all">All nations</option>${nations.map(n=>`<option value="${esc(n)}" ${filters.nationality===n?'selected':''}>${esc(n)}</option>`).join('')}`
    };
  }

  function toolHtml(c,old){
    const q=old.querySelector('[data-v050-search]')?.value||'', pos=old.querySelector('[data-v050-position]')?.value||'All', opt=options(c);
    return `<div class="v050-market-tools v057-tools" data-v057-tools>
      <div class="v057-primary">
        <div class="v050-search-wrap"><input type="search" value="${esc(q)}" placeholder="Search player or club" data-v050-search aria-label="Search transfer market"><span data-v050-market-count>—</span></div>
        <select data-v050-position aria-label="Position"><option ${pos==='All'?'selected':''}>All</option><option ${pos==='GK'?'selected':''}>GK</option><option ${pos==='DEF'?'selected':''}>DEF</option><option ${pos==='MID'?'selected':''}>MID</option><option ${pos==='ATT'?'selected':''}>ATT</option></select>
        <select data-v057-sort aria-label="Sort"><option value="value-desc" ${filters.sort==='value-desc'?'selected':''}>Value · High to low</option><option value="value-asc" ${filters.sort==='value-asc'?'selected':''}>Value · Low to high</option><option value="age-asc" ${filters.sort==='age-asc'?'selected':''}>Age · Youngest</option><option value="age-desc" ${filters.sort==='age-desc'?'selected':''}>Age · Oldest</option><option value="contract" ${filters.sort==='contract'?'selected':''}>Contract · Expiring</option><option value="wage-asc" ${filters.sort==='wage-asc'?'selected':''}>Wage · Low to high</option><option value="name" ${filters.sort==='name'?'selected':''}>Name · A-Z</option></select>
        <button type="button" class="v057-toggle ${advanced?'is-active':''}" data-v057-more>${advanced?'LESS FILTERS':'MORE FILTERS'}</button>
      </div>
      <div class="v057-quick"><button class="v057-chip ${filters.affordable?'is-active':''}" data-v057-chip="affordable">AFFORDABLE ONLY</button><button class="v057-chip ${filters.expiring?'is-active':''}" data-v057-chip="expiring">EXPIRING SOON</button><button class="v057-chip ${filters.u23?'is-active':''}" data-v057-chip="u23">U23</button><span class="v057-summary" data-v057-summary></span></div>
      <div class="v057-more" data-v057-panel ${advanced?'':'hidden'}>
        <label class="v057-field"><span>Age</span><select data-v057-filter="age"><option value="any">Any age</option><option value="u21" ${filters.age==='u21'?'selected':''}>21 and under</option><option value="u23" ${filters.age==='u23'?'selected':''}>23 and under</option><option value="24-28" ${filters.age==='24-28'?'selected':''}>24–28</option><option value="29-32" ${filters.age==='29-32'?'selected':''}>29–32</option><option value="33+" ${filters.age==='33+'?'selected':''}>33+</option></select></label>
        <label class="v057-field"><span>Value</span><select data-v057-filter="value"><option value="any">Any value</option><option value="0-5" ${filters.value==='0-5'?'selected':''}>Up to £5m</option><option value="5-15" ${filters.value==='5-15'?'selected':''}>£5m–£15m</option><option value="15-30" ${filters.value==='15-30'?'selected':''}>£15m–£30m</option><option value="30-60" ${filters.value==='30-60'?'selected':''}>£30m–£60m</option><option value="60+" ${filters.value==='60+'?'selected':''}>£60m+</option></select></label>
        <label class="v057-field"><span>Contract</span><select data-v057-filter="contract"><option value="any">Any contract</option><option value="1" ${filters.contract==='1'?'selected':''}>≤ 1 year</option><option value="2" ${filters.contract==='2'?'selected':''}>≤ 2 years</option><option value="3+" ${filters.contract==='3+'?'selected':''}>3+ years</option></select></label>
        <label class="v057-field"><span>Max wage</span><select data-v057-filter="wage"><option value="any">Any wage</option><option value="25" ${filters.wage==='25'?'selected':''}>£25k/wk</option><option value="50" ${filters.wage==='50'?'selected':''}>£50k/wk</option><option value="100" ${filters.wage==='100'?'selected':''}>£100k/wk</option><option value="200" ${filters.wage==='200'?'selected':''}>£200k/wk</option><option value="200+" ${filters.wage==='200+'?'selected':''}>£200k+/wk</option></select></label>
        <label class="v057-field"><span>Club</span><select data-v057-filter="club">${opt.clubs}</select></label>
        <label class="v057-field"><span>Nationality</span><select data-v057-filter="nationality">${opt.nations}</select></label>
        <button type="button" class="v057-reset" data-v057-reset>RESET FILTERS</button>
      </div>
    </div>`;
  }

  function row(c,p){const contract=getPlayerContract(c,p);return `<button class="v050-player-row ${p.id===selectedId?'is-selected':''}" data-v050-player="${esc(p.id)}"><span class="v050-pos">${esc(p.primaryPosition||p.positionGroup||'—')}</span><span><strong>${esc(p.name)}</strong><small>${esc(clubName(p.clubId))} · Age ${esc(p.reportedAge||'—')} · Jun ${contract?.expiryYear||'—'}</small></span><span class="v050-value">${money(estimatePlayerValue(p))}</span></button>`}

  function budgetFlag(c){
    const detail=document.querySelector('[data-v050-detail]');if(!detail)return;
    detail.querySelector('[data-v057-budget]')?.remove();
    const button=document.querySelector('[data-v050-player].is-selected');
    const p=button?db?.players?.find(item=>item.id===button.dataset.v050Player):null;if(!p)return;
    const budget=getTransferBudget(c),asking=getAskingPrice(p,db,c),wage=Number(getPlayerContract(c,p)?.weeklyWage||estimateWeeklyWage(p)),ok=asking<=budget.transferBudget&&wage<=budget.wageRoom;
    const flag=document.createElement('span');flag.dataset.v057Budget='1';flag.className=`v057-budget ${ok?'good':''}`;flag.textContent=ok?'WITHIN CURRENT BUDGET':asking>budget.transferBudget?`OVER BUDGET · ${money(asking-budget.transferBudget)}`:'WAGE DEMAND EXCEEDS ROOM';detail.querySelector('.v050-detail-head>div:first-child')?.appendChild(flag);
  }

  function render(){
    const c=career(),page=document.querySelector('.v050-transfer-page');if(!c||!db||!page)return;
    const active=page.querySelector('.v050-tabs button.is-active')?.textContent?.trim().split('·')[0].trim();if(active!=='MARKET')return;
    let tools=page.querySelector('.v050-market-tools');if(!tools)return;
    if(!tools.matches('[data-v057-tools]')){const box=document.createElement('div');box.innerHTML=toolHtml(c,tools).trim();tools.replaceWith(box.firstElementChild);tools=page.querySelector('[data-v057-tools]')}
    const list=page.querySelector('[data-v050-player-list]');if(!list)return;
    const original=list.querySelector('.v050-player-row.is-selected')?.dataset.v050Player;if(original)selectedId=original;
    const rows=market(c);if(!rows.some(p=>p.id===selectedId))selectedId=rows[0]?.id||null;
    const key=JSON.stringify([query(),position(),filters,selectedId,rows.slice(0,120).map(p=>p.id)]);
    if(list.dataset.v057Key!==key){const y=list.scrollTop;list.innerHTML=rows.length?rows.slice(0,120).map(p=>row(c,p)).join(''):'<div class="v050-empty"><strong>NO PLAYERS MATCH</strong><span>Relax one or more recruitment filters.</span></div>';list.dataset.v057Key=key;list.scrollTop=y;const selected=selectedId?list.querySelector(`[data-v050-player="${CSS.escape(selectedId)}"]`):null,current=page.querySelector('.v050-detail h3')?.textContent?.trim(),target=selectedId?db.players.find(p=>p.id===selectedId):null;if(selected&&target&&current!==target.name)requestAnimationFrame(()=>selected.isConnected&&selected.click())}
    const count=page.querySelector('[data-v050-market-count]');if(count)count.textContent=`${Math.min(rows.length,120)} / ${rows.length}`;
    const summary=page.querySelector('[data-v057-summary]');if(summary)summary.textContent=`${rows.length} PLAYER${rows.length===1?'':'S'} MATCHING`;
    budgetFlag(c);
  }

  function schedule(){if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(async()=>{frame=0;styles();await loadDb();render()})}

  function reset(){
    Object.assign(filters,{age:'any',value:'any',contract:'any',wage:'any',club:'all',nationality:'all',sort:'value-desc',affordable:false,expiring:false,u23:false});selectedId=null;
    const search=document.querySelector('[data-v050-search]'),pos=document.querySelector('[data-v050-position]');
    if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
    if(pos){pos.value='All';pos.dispatchEvent(new Event('change',{bubbles:true}))}
    requestAnimationFrame(()=>{const tools=document.querySelector('[data-v057-tools]');if(tools){const c=career(),box=document.createElement('div');box.innerHTML=toolHtml(c,tools).trim();tools.replaceWith(box.firstElementChild)}schedule()});
  }

  document.addEventListener('click',event=>{
    const p=event.target.closest?.('[data-v050-player]');if(p)selectedId=p.dataset.v050Player;
    const more=event.target.closest?.('[data-v057-more]');if(more){advanced=!advanced;more.classList.toggle('is-active',advanced);more.textContent=advanced?'LESS FILTERS':'MORE FILTERS';const panel=document.querySelector('[data-v057-panel]');if(panel)panel.hidden=!advanced;return}
    const chip=event.target.closest?.('[data-v057-chip]');if(chip){const key=chip.dataset.v057Chip;filters[key]=!filters[key];chip.classList.toggle('is-active',filters[key]);selectedId=null;schedule();return}
    if(event.target.closest?.('[data-v057-reset]')){event.preventDefault();reset()}
  },true);

  document.addEventListener('change',event=>{
    const f=event.target.closest?.('[data-v057-filter]');if(f){filters[f.dataset.v057Filter]=f.value;selectedId=null;schedule();return}
    const sort=event.target.closest?.('[data-v057-sort]');if(sort){filters.sort=sort.value;schedule();return}
    if(event.target.closest?.('[data-v050-position]')){selectedId=null;requestAnimationFrame(schedule)}
  },true);
  document.addEventListener('input',event=>{if(event.target.closest?.('[data-v050-search]')){selectedId=null;requestAnimationFrame(schedule)}},true);
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  ['flm:career-opened','flm:career-data-refresh','flm:career-sync-complete'].forEach(name=>document.addEventListener(name,schedule));
  styles();schedule();window.FLMTransferFilters=Object.freeze({version:VERSION,refresh:schedule,reset});
})();
