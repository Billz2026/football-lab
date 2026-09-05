const STYLE_HREF = './matchday-cm-v3.css?v=3.0.0';
let queued = false;

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-cm-v3.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function clean(value){ return String(value || '').trim(); }

function findStat(live,label){
  const row = [...live.querySelectorAll('[data-live-stats] .flm-stat-row')]
    .find(item => clean(item.querySelector('span')?.textContent).toLowerCase() === label.toLowerCase());
  if (!row) return null;
  return {
    home: clean(row.querySelector('strong:first-child')?.textContent),
    away: clean(row.querySelector('strong:last-child')?.textContent)
  };
}

function numberFrom(value,fallback=0){
  const parsed = Number(String(value || '').replace('%','').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureMeta(live){
  let meta = live.querySelector('.flm-cm-v3-meta');
  if (meta) return meta;
  const focus = live.querySelector('.flm-cm-v2-focus');
  if (!focus) return null;
  meta = document.createElement('div');
  meta.className = 'flm-cm-v3-meta';
  meta.innerHTML = `
    <div class="flm-cm-v3-meta-head"><span data-cm3-home>HOME</span><b data-cm3-phase>FIRST HALF · MOMENTUM</b><span data-cm3-away>AWAY</span></div>
    <div class="flm-cm-v3-momentum" data-cm3-momentum><span class="home"></span><span class="away"></span></div>
    <div class="flm-cm-v3-quickstats">
      <div><small>POSSESSION</small><strong data-cm3-possession>50% · 50%</strong></div>
      <div><small>SHOTS</small><strong data-cm3-shots>0 · 0</strong></div>
      <div><small>ON TARGET</small><strong data-cm3-target>0 · 0</strong></div>
      <div><small>xG</small><strong data-cm3-xg>0.00 · 0.00</strong></div>
    </div>`;
  focus.after(meta);
  return meta;
}

function phaseFor(minute,live){
  if (live.classList.contains('is-full-time') || minute >= 90) return 'FULL TIME';
  if (live.classList.contains('is-half-time')) return 'HALF TIME';
  return minute >= 46 ? 'SECOND HALF · MOMENTUM' : 'FIRST HALF · MOMENTUM';
}

function sync(live){
  if (!live?.isConnected || live.dataset.cmMatchV2 !== '1') return;
  ensureStyles();
  live.dataset.cmMatchV3 = '1';

  const teams = [...live.querySelectorAll('.flm-live-team strong')];
  const homeName = clean(teams[0]?.textContent) || 'HOME';
  const awayName = clean(teams[1]?.textContent) || 'AWAY';
  const meta = ensureMeta(live);
  if (!meta) return;

  const clock = clean(live.querySelector('[data-live-clock]')?.textContent);
  const minute = numberFrom(clock.split(':')[0],0);
  meta.querySelector('[data-cm3-home]').textContent = homeName;
  meta.querySelector('[data-cm3-away]').textContent = awayName;
  meta.querySelector('[data-cm3-phase]').textContent = phaseFor(minute,live);

  const possession = findStat(live,'Possession') || {home:'50%',away:'50%'};
  const homePoss = Math.max(0,Math.min(100,numberFrom(possession.home,50)));
  const awayPoss = Math.max(0,Math.min(100,numberFrom(possession.away,100-homePoss)));
  meta.querySelector('[data-cm3-momentum]').style.setProperty('--cm3-home-share',`${homePoss}%`);
  meta.querySelector('[data-cm3-possession]').textContent = `${Math.round(homePoss)}% · ${Math.round(awayPoss)}%`;

  const shots = findStat(live,'Shots') || {home:'0',away:'0'};
  const target = findStat(live,'On target') || {home:'0',away:'0'};
  const xg = findStat(live,'xG') || {
    home:Number(window.__flmLiveXg?.home || 0).toFixed(2),
    away:Number(window.__flmLiveXg?.away || 0).toFixed(2)
  };
  meta.querySelector('[data-cm3-shots]').textContent = `${shots.home || 0} · ${shots.away || 0}`;
  meta.querySelector('[data-cm3-target]').textContent = `${target.home || 0} · ${target.away || 0}`;
  meta.querySelector('[data-cm3-xg]').textContent = `${xg.home || '0.00'} · ${xg.away || '0.00'}`;
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm-match-v2="1"]').forEach(sync);
  });
}

ensureStyles();
window.addEventListener('flm:live-xg',queue);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-match-v2','data-cm-view']});
queue();
