const STYLE_HREF = './matchday-experience-v31.css?v=3.1.0';
let queued = false;

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-experience-v31.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

const clean = value => String(value || '').replace(/\s+/g,' ').trim();
const normal = value => clean(value).toLowerCase();

function numberFrom(value,fallback=0){
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g,''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currentMinute(live){
  const clock = clean(live.querySelector('[data-live-clock]')?.textContent);
  return Math.max(0,numberFrom(clock.split(':')[0],0));
}

function lineMinute(line){
  return Math.max(0,numberFrom(line.querySelector('b')?.textContent,0));
}

function lineText(line){
  return clean(line.querySelector('span')?.textContent || line.textContent);
}

function lineSide(line){
  const side = line.dataset.cmSide;
  return side === 'home' || side === 'away' ? side : 'neutral';
}

function lineType(line){
  const known = ['goal','save','miss','corner','yellow','red','injury','substitution','tactical','role-change','shape-change','role','instruction','situation','marker'];
  return known.find(type => line.classList.contains(type)) || 'commentary';
}

function pressureWeight(line){
  const type = lineType(line);
  const text = normal(lineText(line));
  const base = {
    goal:7.5,
    save:3.8,
    miss:3.0,
    corner:2.5,
    red:2.1,
    yellow:1.0,
    injury:.35,
    substitution:.25,
    tactical:.4,
    'role-change':.35,
    'shape-change':.35,
    role:.9,
    instruction:1.0,
    situation:.8,
    marker:.25,
    commentary:1.0
  }[type] ?? 1;
  let bonus = 0;
  if (/penalt|open goal|one[- ]on[- ]one|clear through|great chance|big chance/.test(text)) bonus += 2.2;
  else if (/shot|shoot|header|headed|through|close range|cross|inside the box|into the area/.test(text)) bonus += 1.1;
  if (/attacks the space|breaks forward|dangerous area|overload|stretches the defence/.test(text)) bonus += .7;
  if (/keeps possession|recycle|patient|holds the shape/.test(text)) bonus += .15;
  return base + bonus;
}

function uniqueEvents(live,{fromMinute=0,toMinute=Infinity}={}){
  const map = new Map();
  for (const line of live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')) {
    const minute = lineMinute(line);
    const side = lineSide(line);
    if (minute < fromMinute || minute > toMinute || side === 'neutral') continue;
    const type = lineType(line);
    const key = `${minute}:${side}:${type}`;
    const event = { line, minute, side, type, text:lineText(line), weight:pressureWeight(line) };
    const prior = map.get(key);
    if (!prior || event.weight > prior.weight) map.set(key,event);
  }
  return [...map.values()];
}

function recentPressure(live){
  const minute = currentMinute(live);
  const events = uniqueEvents(live,{fromMinute:Math.max(0,minute-5),toMinute:minute});
  let home = .75;
  let away = .75;
  events.forEach(event => { if (event.side === 'home') home += event.weight; else away += event.weight; });
  const total = home + away;
  const homeShare = total ? Math.round(home / total * 100) : 50;
  return { home:homeShare, away:100-homeShare, count:events.length };
}

function classifyZone(event){
  const text = normal(event.text);
  if (event.type === 'goal' || event.type === 'save' || event.type === 'miss' || event.type === 'corner') return 'attack';
  if (/open goal|one[- ]on[- ]one|through|chance|shot|shoot|header|headed|cross|box|area|corner|attacks the space|breaks forward|dangerous|stretches the defence|overload/.test(text)) return 'attack';
  if (/cuts out|clears|clearance|holds his position|holds the shape|reads the danger|last[- ]ditch|keeper|goalkeeper|defensive|sitting deeper|behind the ball|backing into/.test(text)) return 'defence';
  return 'midfield';
}

function actionZones(live){
  const events = uniqueEvents(live);
  const zones = {
    defence:{ total:0,home:0,away:0 },
    midfield:{ total:0,home:0,away:0 },
    attack:{ total:0,home:0,away:0 }
  };
  events.forEach(event => {
    const zone = classifyZone(event);
    zones[zone].total += 1;
    zones[zone][event.side] += 1;
  });
  const total = Object.values(zones).reduce((sum,zone)=>sum+zone.total,0) || 1;
  for (const zone of Object.values(zones)) {
    zone.share = Math.round(zone.total / total * 100);
    const sideTotal = zone.home + zone.away;
    zone.homeShare = sideTotal ? Math.round(zone.home / sideTotal * 100) : 50;
    zone.awayShare = 100 - zone.homeShare;
  }
  const rounded = zones.defence.share + zones.midfield.share + zones.attack.share;
  if (rounded !== 100) zones.midfield.share += 100 - rounded;
  return zones;
}

function compactCommentary(input){
  let text = clean(input);
  if (!text) return text;

  const rules = [
    [/^(.+?) looks uncomfortable at .*?\. The positional mismatch leaves space for the opposition\.?$/i,'$1 is caught out of position'],
    [/^(.+?) reads the danger from .*? and holds the shape as .*?\.?$/i,'$1 reads the danger and clears'],
    [/^(.+?) finds space from .*?, linking the play in the .*? role\.?$/i,'$1 finds space and links the play'],
    [/^(.+?) keeps stretching the defence from .*? as a .*?\.?$/i,'$1 stretches the defence'],
    [/^(.+?) breaks from .*? in the .*? role and gets into a dangerous area\.?$/i,'$1 breaks into a dangerous area'],
    [/^(.+?) attacks the space from .*?\.?.*$/i,'$1 attacks the space'],
    [/^(.+?) drives forward on his attacking instruction but cannot keep the effort on target\.?$/i,'$1 drives forward... wide!'],
    [/^(.+?) breaks forward from his attacking duty and gets a shot away\.?$/i,'$1 breaks forward and shoots'],
    [/^(.+?) holds his position exactly as instructed and cuts out the danger before .*? can break\.?$/i,'$1 holds his position and cuts out the danger'],
    [/^(.+?) drops into support, gives .*? an extra passing option and helps recycle possession\.?$/i,'$1 drops deep and keeps possession moving'],
    [/^(.+?) is beginning to look tired at \d+% condition\.?$/i,'$1 is starting to tire'],
    [/^(.+?) are staying patient in their .*? while .*? try to disrupt the rhythm\.?$/i,'$1 keep possession and probe for space'],
    [/^(.+?) are taking risks now\. The .*? is stretching the game in search of chances\.?$/i,'$1 push forward in search of a chance'],
    [/^(.+?) are sitting deeper in their .*?, keeping numbers behind the ball\.?$/i,'$1 drop deep behind the ball']
  ];
  for (const [pattern,replacement] of rules) {
    if (pattern.test(text)) { text = text.replace(pattern,replacement); break; }
  }

  text = text
    .replace(/\s+exactly as instructed/gi,'')
    .replace(/\s+in the [A-Za-z -]+ role\b/gi,'')
    .replace(/\s+from (?:GK|RB|LB|CB|RCB|LCB|RWB|LWB|CM|RCM|LCM|DM|AM|RAM|LAM|RW|LW|ST|RST|LST)\b/gi,'')
    .replace(/\s+/g,' ')
    .trim();

  if (text.length <= 92) return text;
  const sentence = text.match(/^(.{28,92}?[.!?])(?:\s|$)/);
  if (sentence) return sentence[1];
  const cut = text.slice(0,89);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0,lastSpace > 58 ? lastSpace : 89).replace(/[,:;.-]+$/,'')}...`;
}

function ensurePressure(live){
  const meta = live.querySelector('.flm-cm-v3-meta');
  if (!meta) return null;
  let block = meta.querySelector('.cm31-pressure');
  if (block) return block;
  block = document.createElement('div');
  block.className = 'cm31-pressure';
  block.innerHTML = `
    <div class="cm31-pressure-head"><span>LAST 5 MINS</span><strong data-cm31-pressure-copy>50% · 50%</strong></div>
    <div class="cm31-pressure-bar" data-cm31-pressure-bar>
      <span class="home"><b data-cm31-pressure-home>50%</b></span>
      <span class="away"><b data-cm31-pressure-away>50%</b></span>
    </div>`;
  const head = meta.querySelector('.flm-cm-v3-meta-head');
  if (head) head.after(block); else meta.prepend(block);
  return block;
}

function ensureActionZones(live){
  const tabs = live.querySelector('.flm-cm-v2-tabs');
  const grid = live.querySelector('.flm-live-grid');
  if (!tabs || !grid) return null;

  let panel = grid.querySelector('.cm31-action-zones');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'cm31-action-zones';
    panel.innerHTML = `
      <div class="cm31-zones-head">
        <div><small>MATCH TERRITORY</small><h3>ACTION ZONES</h3></div>
        <span>INFERRED FROM LIVE EVENT CONTEXT</span>
      </div>
      <div class="cm31-zones-pitch">
        <article data-cm31-zone="defence"><small>DEFENSIVE THIRD</small><strong data-cm31-zone-share>33%</strong><div class="cm31-zone-split"><i class="home"></i><i class="away"></i></div><em data-cm31-zone-teams>50% · 50%</em></article>
        <article data-cm31-zone="midfield"><small>MIDDLE THIRD</small><strong data-cm31-zone-share>34%</strong><div class="cm31-zone-split"><i class="home"></i><i class="away"></i></div><em data-cm31-zone-teams>50% · 50%</em></article>
        <article data-cm31-zone="attack"><small>FINAL THIRD</small><strong data-cm31-zone-share>33%</strong><div class="cm31-zone-split"><i class="home"></i><i class="away"></i></div><em data-cm31-zone-teams>50% · 50%</em></article>
      </div>
      <div class="cm31-zones-key"><span class="home" data-cm31-zone-home>HOME</span><b>TEAM SHARE WITHIN EACH ZONE</b><span class="away" data-cm31-zone-away>AWAY</span></div>`;
    grid.appendChild(panel);
  }

  let actionButton = tabs.querySelector('[data-cm31-view="zones"]');
  if (!actionButton) {
    const tacticsTab = tabs.querySelector('[data-cm-v2-view="tactics"]');
    if (tacticsTab) tacticsTab.classList.add('cm31-hidden-tactics-tab');
    actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.textContent = 'ACTION ZONES';
    actionButton.dataset.cm31View = 'zones';
    const report = tabs.querySelector('[data-cm-v2-view="report"]');
    tabs.insertBefore(actionButton,report || null);
    actionButton.addEventListener('click',()=>{
      live.dataset.cmView = 'zones';
      tabs.querySelectorAll('button').forEach(button=>button.classList.toggle('is-active',button===actionButton));
    });
    tabs.addEventListener('click',event=>{
      if (event.target === actionButton) return;
      if (event.target.closest('button')) actionButton.classList.remove('is-active');
    });
  }
  return panel;
}

function syncFocus(live){
  const current = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')].at(-1);
  const target = live.querySelector('.flm-cm-v2-focus .flm-cm-v2-text');
  if (!current || !target) return;
  const compact = compactCommentary(lineText(current));
  if (!compact || target.textContent === compact) return;
  target.textContent = compact;
  target.classList.remove('cm31-event-pop');
  void target.offsetWidth;
  target.classList.add('cm31-event-pop');
}

function syncPressure(live){
  const block = ensurePressure(live);
  if (!block) return;
  const pressure = recentPressure(live);
  const bar = block.querySelector('[data-cm31-pressure-bar]');
  bar.style.setProperty('--cm31-home-share',`${pressure.home}%`);
  block.querySelector('[data-cm31-pressure-home]').textContent = `${pressure.home}%`;
  block.querySelector('[data-cm31-pressure-away]').textContent = `${pressure.away}%`;
  block.querySelector('[data-cm31-pressure-copy]').textContent = `${pressure.home}% · ${pressure.away}%`;
  block.dataset.eventCount = String(pressure.count);
}

function syncZones(live){
  const panel = ensureActionZones(live);
  if (!panel) return;
  const teams = [...live.querySelectorAll('.flm-live-team strong')];
  panel.querySelector('[data-cm31-zone-home]').textContent = clean(teams[0]?.textContent) || 'HOME';
  panel.querySelector('[data-cm31-zone-away]').textContent = clean(teams[1]?.textContent) || 'AWAY';
  const zones = actionZones(live);
  Object.entries(zones).forEach(([key,zone])=>{
    const card = panel.querySelector(`[data-cm31-zone="${key}"]`);
    if (!card) return;
    card.querySelector('[data-cm31-zone-share]').textContent = `${zone.share}%`;
    card.querySelector('[data-cm31-zone-teams]').textContent = `${zone.homeShare}% · ${zone.awayShare}%`;
    card.style.setProperty('--cm31-zone-home',`${zone.homeShare}%`);
  });
}

function sync(live){
  if (!live?.isConnected || live.dataset.cmMatchV3 !== '1') return;
  ensureStyles();
  live.dataset.cmExperience = '3.1';
  ensurePressure(live);
  ensureActionZones(live);
  syncFocus(live);
  syncPressure(live);
  syncZones(live);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(()=>{
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm-match-v3="1"]').forEach(sync);
  });
}

ensureStyles();
window.addEventListener('flm:live-xg',queue);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-match-v3','data-cm-view']});
queue();
