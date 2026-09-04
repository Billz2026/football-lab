import { simulateNextRound } from './manager-core.js?v=0.3.0';

const STYLE_ID = 'flm-match-centre-v045-style';
const VERSION = 'V0.4.5';
let activeShell = null;
let refreshTimer = null;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function club(db, id) {
  return db.clubs.find(item => item.id === id);
}

function clubName(db, id) {
  const item = club(db, id);
  return item?.shortName || item?.name || 'Unknown';
}

function updateVersion() {
  const chip = document.querySelector('.version-chip');
  if (chip) chip.textContent = VERSION;
  const footer = document.querySelector('.footer-build');
  if (footer) footer.textContent = 'V0.4.5 · MATCH CENTRE';
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .flm-live-match[data-v045-match="1"]{isolation:isolate;padding:12px;border:1px solid rgba(84,113,255,.2);border-radius:16px;background:radial-gradient(circle at 75% 34%,rgba(255,255,255,.055),transparent 24rem),radial-gradient(circle at 20% 76%,rgba(99,42,176,.16),transparent 30rem),linear-gradient(145deg,#07091a,#08060f 62%,#030307)}
  .flm-live-match[data-v045-match="1"]>.career-page-heading{margin:0;padding:8px 10px 4px}.flm-live-match[data-v045-match="1"]>.career-page-heading h2{font-size:clamp(25px,3vw,38px)}
  .flm-live-match[data-v045-match="1"] .flm-live-scoreboard{margin:0;border:1px solid #273da8;border-radius:5px;background:linear-gradient(180deg,#0b4bc7,#07399e 58%,#062b7c);box-shadow:inset 0 1px rgba(255,255,255,.22),0 12px 35px rgba(0,0,0,.24)}
  .flm-live-match[data-v045-match="1"] .flm-live-team small{color:#b7ccff;opacity:1}.flm-live-match[data-v045-match="1"] .flm-live-team strong{font-size:clamp(1rem,2vw,1.45rem);color:#fff;text-shadow:0 1px #00184e}
  .flm-live-match[data-v045-match="1"] .flm-live-score{padding:7px 15px;border:1px solid rgba(255,255,255,.35);background:#050509;box-shadow:inset 0 0 20px rgba(0,0,0,.8)}.flm-live-match[data-v045-match="1"] .flm-live-score b{min-width:38px;font-size:2.35rem;color:#fff}.flm-live-match[data-v045-match="1"] .flm-live-clock{color:#ffef43}
  .v045-context{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;border:1px solid rgba(255,255,255,.1);background:#17121f}.v045-context span{padding:8px 10px;background:rgba(0,0,0,.35);color:#a9dfe2;font-size:10px;text-align:center}.v045-context b{color:#efe5aa;font-weight:850}
  .v045-tabs,.v045-bottom-tabs{display:grid;gap:2px}.v045-tabs{grid-template-columns:repeat(4,1fr)}.v045-bottom-tabs{grid-template-columns:repeat(5,1fr)}.v045-tabs button,.v045-bottom-tabs button{min-height:43px;border:1px solid #422778;border-radius:2px;background:linear-gradient(#3d167d,#25085c);color:#ddd1f5;font-size:9px;font-weight:900;letter-spacing:.06em;cursor:pointer}.v045-tabs button.is-active,.v045-bottom-tabs button.is-active{border-color:#ffe85b;color:#fff3a3;box-shadow:inset 0 0 0 1px rgba(255,232,91,.28)}
  .v045-event{display:grid;place-items:center;min-height:82px;padding:10px;border:1px solid rgba(255,220,47,.35);background:linear-gradient(90deg,rgba(255,220,47,.12),rgba(255,220,47,.035),rgba(255,220,47,.12));text-align:center}.v045-event strong{display:block;color:#ffed38;font-size:clamp(1.3rem,3vw,2.4rem);letter-spacing:.02em}.v045-event span{display:block;max-width:900px;margin-top:4px;color:#cac4b9;font-size:11px;line-height:1.4}.v045-event.is-goal{background:#f2db00;border-color:#fff27e}.v045-event.is-goal strong,.v045-event.is-goal span{color:#111}.v045-event.is-yellow{background:#f1dd22;border-color:#fff}.v045-event.is-yellow strong,.v045-event.is-yellow span{color:#121212}.v045-event.is-red{background:#a80e18;border-color:#ff6970}.v045-event.is-red strong,.v045-event.is-red span{color:#fff}.v045-event.is-half,.v045-event.is-full{background:#114aa4;border-color:#7ca6ff}.v045-event.is-half strong,.v045-event.is-full strong{color:#fff}.v045-event.is-quiet{min-height:52px;background:rgba(7,23,61,.72);border-color:rgba(73,109,192,.45)}.v045-event.is-quiet strong{font-size:1rem;color:#bcd4ff}
  .flm-live-match[data-v045-match="1"] .flm-live-grid{gap:8px}.flm-live-match[data-v045-match="1"] .flm-panel{border-radius:3px;border-color:rgba(110,92,160,.4);background:rgba(0,0,0,.42)}.flm-live-match[data-v045-match="1"] .flm-commentary-feed{height:390px}.flm-live-match[data-v045-match="1"] .flm-commentary-line{border-radius:1px;background:rgba(0,0,0,.26)}
  .v045-view{display:none;min-height:440px;padding:18px;border:1px solid rgba(110,92,160,.4);background:rgba(0,0,0,.45)}.v045-view.is-active{display:block}.v045-view-title{display:flex;justify-content:space-between;gap:15px;align-items:end;padding-bottom:10px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,.1)}.v045-view-title h3{margin:0;color:#f3e84a;font-size:1.35rem}.v045-view-title span{color:#8ba1bd;font-size:9px;letter-spacing:.1em}
  .v045-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v045-stat{display:grid;grid-template-columns:54px 1fr 54px;align-items:center;gap:10px;padding:10px;border:1px solid rgba(255,255,255,.08);background:rgba(30,25,43,.72)}.v045-stat>span{text-align:center;color:#aca4ba;font-size:10px}.v045-stat strong:last-child{text-align:right}.v045-bar{height:7px;margin-top:6px;background:#16141b;overflow:hidden}.v045-bar i{display:block;height:100%;background:linear-gradient(90deg,#315fe8,#be45cd)}
  .v045-zone-wrap{display:grid;gap:16px}.v045-zone-pitch{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;min-height:210px;border:1px solid rgba(255,255,255,.27);background:linear-gradient(#163824,#102b1c)}.v045-zone-pitch>div{display:grid;place-items:center;border-right:1px solid rgba(255,255,255,.18);color:#d9e6db;font-size:10px;text-align:center}.v045-zone-pitch>div:last-child{border:0}.v045-pressure{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px}.v045-pressure-track{height:22px;display:flex;background:#17131f;border:1px solid rgba(255,255,255,.1)}.v045-pressure-track i:first-child{background:#245bd2}.v045-pressure-track i:last-child{background:#8d2c9f}.v045-pressure small{color:#958da2}.v045-zone-note{color:#817a87;font-size:10px;line-height:1.5}
  .v045-report{display:grid;gap:5px;max-height:430px;overflow:auto}.v045-report-row{display:grid;grid-template-columns:48px 1fr;gap:9px;padding:8px 10px;border-left:3px solid #493176;background:rgba(255,255,255,.025);font-size:11px}.v045-report-row.goal{border-color:#ffe132}.v045-report-row.red{border-color:#e83943}.v045-report-row.yellow{border-color:#e3ce37}.v045-report-row.injury{border-color:#dd7f39}.v045-report-row b{color:#e8cb73}
  .v045-scores{display:grid;gap:6px}.v045-score-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.08);background:rgba(25,20,37,.72)}.v045-score-row strong:last-child{text-align:right}.v045-score-row b{padding:4px 9px;background:#050509;color:#fff;font-size:1rem}
  .v045-table-wrap{overflow:auto}.v045-table{width:100%;border-collapse:collapse;font-size:10px}.v045-table th,.v045-table td{padding:7px 8px;border-bottom:1px solid rgba(255,255,255,.07);text-align:right}.v045-table th:nth-child(2),.v045-table td:nth-child(2){text-align:left}.v045-table tr.is-user{background:rgba(255,226,59,.09);color:#fff1a0}.v045-table th{color:#8e86a0;font-size:8px;letter-spacing:.08em}
  .v045-bottom-tabs{margin-top:2px}.flm-live-match[data-v045-match="1"] .career-match-actions{border-radius:2px;background:rgba(11,11,20,.86)}
  @media(max-width:820px){.v045-context{grid-template-columns:1fr 1fr}.v045-tabs{grid-template-columns:1fr 1fr}.v045-bottom-tabs{grid-template-columns:1fr 1fr}.v045-stat-grid{grid-template-columns:1fr}.v045-event{min-height:64px}.flm-live-match[data-v045-match="1"] .flm-live-scoreboard{grid-template-columns:1fr 100px 1fr}.flm-live-match[data-v045-match="1"] .flm-live-team strong{font-size:.85rem}}
  `;
  document.head.appendChild(style);
}

function minuteOf(shell) {
  return Number.parseInt(shell.querySelector('[data-live-clock]')?.textContent || '0', 10) || 0;
}

function scoreOf(shell) {
  return {
    home: Number(shell.querySelector('[data-home-score]')?.textContent || 0),
    away: Number(shell.querySelector('[data-away-score]')?.textContent || 0)
  };
}

function statRows(shell) {
  return [...shell.querySelectorAll('[data-live-stats] .flm-stat-row')].map(row => {
    const values = row.querySelectorAll('strong');
    return {
      label: row.querySelector('span')?.textContent?.trim() || '',
      home: values[0]?.textContent?.trim() || '0',
      away: values[1]?.textContent?.trim() || '0'
    };
  });
}

function numericStat(rows, label) {
  const row = rows.find(item => item.label.toLowerCase() === label.toLowerCase());
  if (!row) return [0, 0];
  return [Number.parseFloat(row.home) || 0, Number.parseFloat(row.away) || 0];
}

function gameContext(career, home, fixture) {
  const seed = hashString(`${career.seed}:${fixture.id}:context`);
  const weather = ['Dry, 17°C', 'Overcast, 15°C', 'Light rain, 13°C', 'Clear, 19°C', 'Breezy, 16°C'][seed % 5];
  const referees = ['A. Mercer', 'D. Holloway', 'M. Keane', 'S. Bennett', 'R. Cole'];
  const attendanceBase = 9000 + Math.max(0, (home?.reputation || 6500) - 5000) * 7;
  const attendance = Math.round(clamp(attendanceBase + (seed % 4200), 6500, 61000));
  return { weather, referee: referees[(seed >>> 4) % referees.length], attendance };
}

function goalMinutes(fixtureId, count, side) {
  const minutes = [];
  for (let index = 0; index < count; index += 1) {
    let minute = 5 + (hashString(`${fixtureId}:${side}:${index}`) % 84);
    while (minutes.includes(minute) && minute < 89) minute += 1;
    minutes.push(minute);
  }
  return minutes.sort((a, b) => a - b);
}

function scoreAtMinute(result, minute) {
  const homeMinutes = goalMinutes(result.id, result.homeGoals || 0, 'home');
  const awayMinutes = goalMinutes(result.id, result.awayGoals || 0, 'away');
  return {
    homeClubId: result.homeClubId,
    awayClubId: result.awayClubId,
    homeGoals: homeMinutes.filter(value => value <= minute).length,
    awayGoals: awayMinutes.filter(value => value <= minute).length
  };
}

function applyLiveResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  if (!home || !away) return;
  home.played += 1; away.played += 1;
  home.goalsFor += result.homeGoals; home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals; away.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) { home.won += 1; home.points += 3; away.lost += 1; }
  else if (result.homeGoals < result.awayGoals) { away.won += 1; away.points += 3; home.lost += 1; }
  else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function liveRound(career, projected, minute, userFixture, score) {
  const round = projected.fixtures[career.roundIndex] || [];
  return round.map(result => {
    if (result.id === userFixture.id) {
      return { homeClubId: result.homeClubId, awayClubId: result.awayClubId, homeGoals: score.home, awayGoals: score.away, id: result.id };
    }
    return { ...scoreAtMinute(result, minute), id: result.id };
  });
}

function liveTable(career, liveResults) {
  const table = clone(career.table);
  liveResults.forEach(result => applyLiveResult(table, result));
  return table.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.clubId.localeCompare(b.clubId));
}

function eventState(shell) {
  const raw = shell.querySelector('[data-commentary-state]')?.textContent?.trim().toUpperCase() || 'LIVE';
  const last = shell.querySelector('[data-commentary-feed] .flm-commentary-line:last-child');
  const detail = last?.querySelector('span')?.textContent?.trim() || '';
  const mapping = {
    'BOOKING': ['YELLOW CARD!', 'yellow'],
    'GOAL': ['GOAL!', 'goal'],
    'RED CARD': ['RED CARD!', 'red'],
    'INJURY': ['INJURY', 'red'],
    'SUBSTITUTION': ['SUBSTITUTION', 'quiet'],
    'TACTICAL CHANGE': ['TACTICAL CHANGE', 'quiet'],
    'ROLE CHANGE': ['ROLE CHANGE', 'quiet'],
    'POSITIONAL SWITCH': ['POSITIONAL SWITCH', 'quiet'],
    'HALF TIME': ['HALF TIME', 'half'],
    'FULL TIME': ['FULL TIME', 'full'],
    'PAUSED': ['MATCH PAUSED', 'quiet'],
    'SECOND HALF': ['SECOND HALF', 'quiet'],
    'KICK-OFF': ['KICK OFF', 'quiet'],
    'LIVE': ['MATCH IN PROGRESS', 'quiet']
  };
  const [title, type] = mapping[raw] || [raw, 'quiet'];
  return { title, type, detail };
}

function renderStats(shell, host) {
  const rows = statRows(shell);
  host.innerHTML = `<div class="v045-view-title"><h3>Match Stats</h3><span>LIVE MATCH DATA</span></div><div class="v045-stat-grid">${rows.map(row => {
    const h = Number.parseFloat(row.home) || 0, a = Number.parseFloat(row.away) || 0, total = h + a;
    const width = row.label === 'Possession' ? h : total ? Math.round(h / total * 100) : 50;
    return `<div class="v045-stat"><strong>${esc(row.home)}</strong><div><span>${esc(row.label)}</span><div class="v045-bar"><i style="width:${clamp(width, 0, 100)}%"></i></div></div><strong>${esc(row.away)}</strong></div>`;
  }).join('')}</div>`;
}

function renderZones(shell, host, homeName, awayName) {
  const rows = statRows(shell);
  const [hp] = numericStat(rows, 'Possession');
  const [hs, as] = numericStat(rows, 'Shots');
  const [hot, aot] = numericStat(rows, 'On target');
  const shotShare = hs + as ? hs / (hs + as) * 100 : 50;
  const targetShare = hot + aot ? hot / (hot + aot) * 100 : 50;
  const pressure = Math.round(clamp((hp || 50) * .5 + shotShare * .3 + targetShare * .2, 8, 92));
  host.innerHTML = `<div class="v045-view-title"><h3>Action Zones</h3><span>LIVE TERRITORIAL ESTIMATE</span></div><div class="v045-zone-wrap"><div class="v045-zone-pitch"><div>${esc(homeName)}<br><strong>DEFENSIVE THIRD</strong></div><div>MIDFIELD<br><strong>CONTESTED AREA</strong></div><div>${esc(awayName)}<br><strong>DEFENSIVE THIRD</strong></div></div><div class="v045-pressure"><strong>${pressure}%</strong><div class="v045-pressure-track"><i style="width:${pressure}%"></i><i style="width:${100-pressure}%"></i></div><strong>${100-pressure}%</strong></div><div class="v045-zone-note">Estimated territorial pressure combines live possession, shots and shots on target. It is a match-management indicator, not fabricated event-location tracking.</div></div>`;
}

function renderReport(shell, host) {
  const important = [...shell.querySelectorAll('[data-commentary-feed] .flm-commentary-line')].filter(line => {
    const classes = [...line.classList];
    return classes.some(item => ['goal','yellow','red','injury','substitution','tactical','role-change','shape-change'].includes(item)) || /HALF TIME|FULL TIME/i.test(line.textContent || '');
  });
  host.innerHTML = `<div class="v045-view-title"><h3>Match Report</h3><span>KEY INCIDENTS</span></div><div class="v045-report">${important.length ? important.slice(-40).map(line => {
    const minute = line.querySelector('b')?.textContent || '';
    const text = line.querySelector('span')?.textContent || '';
    const kind = ['goal','yellow','red','injury','substitution'].find(item => line.classList.contains(item)) || '';
    return `<div class="v045-report-row ${kind}"><b>${esc(minute)}</b><span>${esc(text)}</span></div>`;
  }).join('') : '<div class="v045-report-row"><b>—</b><span>No major incidents yet.</span></div>'}</div>`;
}

function renderScores(host, db, liveResults, userFixture) {
  host.innerHTML = `<div class="v045-view-title"><h3>Latest Scores</h3><span>CURRENT ROUND · LIVE</span></div><div class="v045-scores">${liveResults.map(result => `<div class="v045-score-row ${result.id === userFixture.id ? 'is-user' : ''}"><strong>${esc(clubName(db, result.homeClubId))}</strong><b>${result.homeGoals}–${result.awayGoals}</b><strong>${esc(clubName(db, result.awayClubId))}</strong></div>`).join('')}</div>`;
}

function renderTable(host, db, table, userClubId) {
  host.innerHTML = `<div class="v045-view-title"><h3>Live League Table</h3><span>INCLUDING CURRENT SCORES</span></div><div class="v045-table-wrap"><table class="v045-table"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${table.map((row, index) => `<tr class="${row.clubId === userClubId ? 'is-user' : ''}"><td>${index + 1}</td><td>${esc(clubName(db, row.clubId))}</td><td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td><td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td><td><strong>${row.points}</strong></td></tr>`).join('')}</tbody></table></div>`;
}

async function enhance(shell) {
  if (!shell || shell.dataset.v045Match === '1') return;
  const manager = window.FLMManager;
  const career = manager?.activeCareer;
  if (!career || !manager?.loadDatabase) return;
  const db = await manager.loadDatabase();
  if (!shell.isConnected || shell.dataset.v045Match === '1') return;
  const userFixture = career.fixtures?.[career.roundIndex]?.find(item => item.homeClubId === career.clubId || item.awayClubId === career.clubId);
  if (!userFixture) return;
  let projected;
  try { projected = simulateNextRound(career, db); }
  catch { projected = { fixtures: career.fixtures }; }
  const home = club(db, userFixture.homeClubId), away = club(db, userFixture.awayClubId);
  const context = gameContext(career, home, userFixture);

  shell.dataset.v045Match = '1';
  shell.querySelector('.career-page-heading .eyebrow').textContent = `${career.competitionName || 'FOOTBALL LAB'} · ROUND ${userFixture.round}`;
  shell.querySelector('.career-page-heading h2').textContent = 'Match Centre';

  const scoreboard = shell.querySelector('.flm-live-scoreboard');
  const contextBar = document.createElement('div');
  contextBar.className = 'v045-context';
  contextBar.dataset.v045Context = '1';
  contextBar.innerHTML = `<span>VENUE · <b>${esc(home?.venue || 'Home ground')}</b></span><span>ATTENDANCE · <b>${context.attendance.toLocaleString('en-GB')}</b></span><span>REFEREE · <b>${esc(context.referee)}</b></span><span>WEATHER · <b>${esc(context.weather)}</b></span>`;
  scoreboard.after(contextBar);

  const tabs = document.createElement('div');
  tabs.className = 'v045-tabs';
  tabs.innerHTML = `<button class="is-active" data-v045-view="overview">MATCH OVERVIEW</button><button data-v045-view="stats">MATCH STATS</button><button data-v045-view="zones">ACTION ZONES</button><button data-v045-view="report">MATCH REPORT</button>`;
  contextBar.after(tabs);

  const event = document.createElement('div');
  event.className = 'v045-event is-quiet';
  event.dataset.v045Event = '1';
  event.innerHTML = '<strong>MATCH IN PROGRESS</strong><span>Live commentary and match events will appear here.</span>';
  tabs.after(event);

  const liveGrid = shell.querySelector('.flm-live-grid');
  const customView = document.createElement('section');
  customView.className = 'v045-view';
  customView.dataset.v045CustomView = '1';
  liveGrid.after(customView);

  const bottom = document.createElement('div');
  bottom.className = 'v045-bottom-tabs';
  bottom.innerHTML = `<button data-v045-bottom="home-stats">${esc(home?.shortName || home?.name || 'HOME')} STATS</button><button data-v045-bottom="ratings">PLAYER RATINGS</button><button data-v045-bottom="latest">LATEST SCORES</button><button data-v045-bottom="table">LEAGUE TABLE</button><button data-v045-bottom="away-stats">${esc(away?.shortName || away?.name || 'AWAY')} STATS</button>`;
  customView.after(bottom);

  let mode = 'overview';
  const activate = next => {
    mode = next;
    tabs.querySelectorAll('[data-v045-view]').forEach(button => button.classList.toggle('is-active', button.dataset.v045View === next));
    bottom.querySelectorAll('button').forEach(button => button.classList.remove('is-active'));
    liveGrid.style.display = next === 'overview' ? '' : 'none';
    customView.classList.toggle('is-active', next !== 'overview');
    refresh();
  };
  tabs.querySelectorAll('[data-v045-view]').forEach(button => button.addEventListener('click', () => activate(button.dataset.v045View)));
  bottom.querySelector('[data-v045-bottom="home-stats"]').addEventListener('click', () => activate('stats'));
  bottom.querySelector('[data-v045-bottom="away-stats"]').addEventListener('click', () => activate('stats'));
  bottom.querySelector('[data-v045-bottom="ratings"]').addEventListener('click', () => shell.querySelector('[data-open-ratings]')?.click());
  bottom.querySelector('[data-v045-bottom="latest"]').addEventListener('click', () => activate('latest'));
  bottom.querySelector('[data-v045-bottom="table"]').addEventListener('click', () => activate('table'));

  const refresh = () => {
    if (!shell.isConnected) return;
    const currentMinute = minuteOf(shell);
    const score = scoreOf(shell);
    const liveResults = liveRound(career, projected, currentMinute, userFixture, score);
    const table = liveTable(career, liveResults);
    const status = eventState(shell);
    event.className = `v045-event is-${status.type}`;
    event.innerHTML = `<strong>${esc(status.title)}</strong><span>${esc(status.detail || `${home?.name || 'Home'} ${score.home}–${score.away} ${away?.name || 'Away'}`)}</span>`;
    if (mode === 'stats') renderStats(shell, customView);
    else if (mode === 'zones') renderZones(shell, customView, home?.shortName || home?.name || 'Home', away?.shortName || away?.name || 'Away');
    else if (mode === 'report') renderReport(shell, customView);
    else if (mode === 'latest') { renderScores(customView, db, liveResults, userFixture); bottom.querySelector('[data-v045-bottom="latest"]')?.classList.add('is-active'); }
    else if (mode === 'table') { renderTable(customView, db, table, career.clubId); bottom.querySelector('[data-v045-bottom="table"]')?.classList.add('is-active'); }
  };

  refresh();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (!shell.isConnected) { clearInterval(refreshTimer); refreshTimer = null; return; }
    refresh();
  }, 220);
}

function scan() {
  updateVersion();
  const shell = document.querySelector('[data-live-match]');
  if (shell && shell !== activeShell) {
    activeShell = shell;
    enhance(shell).catch(() => {});
  }
  if (!shell) activeShell = null;
}

injectStyles();
updateVersion();
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
scan();
