/* Football Lab Manager — player performance v1
 * Persists authoritative Match Centre outputs into the career save and turns
 * player profiles into performance-driven management screens.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const SAVE_KEY = 'flm-career-save';
  const STYLE_URL = './player-performance-v1.css?v=1.0.0';
  const MAX_MATCHES = 60;
  let dbPromise = null;
  let queued = false;
  let processing = false;

  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function ensureStyles() {
    if (document.querySelector('link[data-flm-player-performance]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_URL;
    link.dataset.flmPlayerPerformance = VERSION;
    document.head.appendChild(link);
  }

  function loadDb() {
    if (!dbPromise && manager()?.loadDatabase) {
      dbPromise = Promise.resolve(manager().loadDatabase()).catch(error => {
        dbPromise = null;
        console.warn('FLM player performance database load failed:', error);
        return null;
      });
    }
    return dbPromise || Promise.resolve(null);
  }

  function persist(c) {
    if (!c) return;
    c.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(c));
      const status = document.querySelector('[data-career-save-status]');
      if (status) status.textContent = 'SAVED';
    } catch (error) {
      console.warn('FLM player performance save failed:', error);
    }
  }

  function seasonKey(c) {
    if (typeof c?.season === 'string' && c.season.trim()) return c.season.trim();
    if (c?.season?.label) return String(c.season.label);
    if (c?.seasonLabel) return String(c.seasonLabel);
    if (c?.currentSeason) return String(c.currentSeason);
    const date = String(c?.currentDate || c?.date || '').slice(0, 10);
    const match = date.match(/^(\d{4})-(\d{2})-/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const start = month >= 6 ? year : year - 1;
      return `${start}/${String(start + 1).slice(-2)}`;
    }
    return '2026/27';
  }

  function emptyPlayerRecord(playerId, clubId) {
    return {
      playerId,
      clubId,
      apps:0,
      starts:0,
      subApps:0,
      minutes:0,
      goals:0,
      assists:0,
      yellowCards:0,
      redCards:0,
      manOfMatch:0,
      ratingTotal:0,
      ratedApps:0,
      averageRating:null,
      competitive:{ apps:0, starts:0, minutes:0, goals:0, assists:0, ratingTotal:0, ratedApps:0, averageRating:null },
      recentRatings:[],
      matches:[]
    };
  }

  function hasRecordedData(players) {
    return Object.values(players || {}).some(record => num(record?.apps) > 0 || (record?.matches || []).length > 0);
  }

  function ensureState(c) {
    if (!c) return null;
    const season = seasonKey(c);
    let changed = false;
    let state = c.playerPerformance;
    if (!state || typeof state !== 'object' || state.schemaVersion !== 1) {
      state = c.playerPerformance = {
        schemaVersion:1,
        season,
        players:{},
        history:[],
        processedFixtureIds:[],
        updatedAt:new Date().toISOString()
      };
      changed = true;
    }
    if (!state.players || typeof state.players !== 'object' || Array.isArray(state.players)) { state.players = {}; changed = true; }
    if (!Array.isArray(state.history)) { state.history = []; changed = true; }
    if (!Array.isArray(state.processedFixtureIds)) { state.processedFixtureIds = []; changed = true; }

    if (state.season !== season) {
      if (state.season && hasRecordedData(state.players)) {
        const archived = {
          season:state.season,
          players:JSON.parse(JSON.stringify(state.players)),
          archivedAt:new Date().toISOString()
        };
        const index = state.history.findIndex(entry => entry?.season === state.season);
        if (index >= 0) state.history[index] = archived; else state.history.push(archived);
      }
      state.season = season;
      state.players = {};
      state.processedFixtureIds = [];
      state.updatedAt = new Date().toISOString();
      changed = true;
    }
    if (changed) persist(c);
    return state;
  }

  function playerRecord(state, playerId, clubId) {
    let record = state.players[playerId];
    if (!record || typeof record !== 'object') {
      record = state.players[playerId] = emptyPlayerRecord(playerId, clubId);
    }
    if (!record.competitive || typeof record.competitive !== 'object') record.competitive = emptyPlayerRecord(playerId, clubId).competitive;
    if (!Array.isArray(record.recentRatings)) record.recentRatings = [];
    if (!Array.isArray(record.matches)) record.matches = [];
    record.clubId = clubId || record.clubId || null;
    return record;
  }

  function locateFixture(c, fixtureId) {
    const league = (c?.fixtures || []).flat().find(fixture => fixture?.id === fixtureId);
    if (league) return league;
    const pre = (c?.preseason?.fixtures || []).find(fixture => fixture?.id === fixtureId);
    return pre || null;
  }

  function isFriendly(fixture) {
    const text = `${fixture?.type || ''} ${fixture?.competitionName || ''} ${fixture?.name || ''}`.toLowerCase();
    return /friendly|pre[- ]?season/.test(text);
  }

  function contributionMaps(events) {
    const goals = new Map();
    const assists = new Map();
    const yellows = new Map();
    const reds = new Map();
    for (const event of events || []) {
      const type = String(event?.type || '').toLowerCase();
      if (type === 'goal' && event.playerId) goals.set(event.playerId, (goals.get(event.playerId) || 0) + 1);
      if (type === 'goal' && event.assistPlayerId) assists.set(event.assistPlayerId, (assists.get(event.assistPlayerId) || 0) + 1);
      if ((type === 'yellow' || type === 'yellow-card') && event.playerId) yellows.set(event.playerId, (yellows.get(event.playerId) || 0) + 1);
      if ((type === 'red' || type === 'red-card') && event.playerId) reds.set(event.playerId, (reds.get(event.playerId) || 0) + 1);
    }
    return { goals, assists, yellows, reds };
  }

  function resultFor(snapshot, side) {
    const home = num(snapshot?.homeGoals);
    const away = num(snapshot?.awayGoals);
    const own = side === 'home' ? home : away;
    const opp = side === 'home' ? away : home;
    return {
      result:own > opp ? 'W' : own < opp ? 'L' : 'D',
      score:`${own}-${opp}`,
      own,
      opp
    };
  }

  function formLabel(recent) {
    const values = (recent || []).slice(-5).map(item => num(item?.rating, NaN)).filter(Number.isFinite);
    if (!values.length) return '—';
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (average >= 7.6) return 'Excellent';
    if (average >= 7.2) return 'Very Good';
    if (average >= 6.9) return 'Good';
    if (average >= 6.6) return 'Average';
    if (average >= 6.2) return 'Poor';
    return 'Very Poor';
  }

  const MORALE = ['Very Low','Low','Fair','Good','Very Good','Excellent'];
  function moraleIndex(value) {
    const text = String(value || 'Good').toLowerCase();
    if (/superb|excellent/.test(text)) return 5;
    if (/very good|high/.test(text)) return 4;
    if (/good/.test(text)) return 3;
    if (/fair|okay|average|balanced/.test(text)) return 2;
    if (/very low|awful/.test(text)) return 0;
    if (/low|poor/.test(text)) return 1;
    return 3;
  }

  function nextMorale(current, rating, result) {
    let pressure = result === 'W' ? .45 : result === 'L' ? -.45 : 0;
    if (rating >= 8) pressure += .8;
    else if (rating >= 7.2) pressure += .35;
    else if (rating < 5.8) pressure -= .8;
    else if (rating < 6.3) pressure -= .35;
    const delta = pressure >= .55 ? 1 : pressure <= -.55 ? -1 : 0;
    return MORALE[clamp(moraleIndex(current) + delta, 0, MORALE.length - 1)];
  }

  function bestPlayerId(snapshot, contributions) {
    const minutes = snapshot?.minutesPlayed || {};
    return Object.keys(minutes)
      .filter(id => num(minutes[id]) > 0 && Number.isFinite(Number(snapshot?.ratings?.[id])))
      .sort((a,b) => {
        const ratingDiff = num(snapshot.ratings[b]) - num(snapshot.ratings[a]);
        if (ratingDiff) return ratingDiff;
        const goalDiff = num(contributions.goals.get(b)) - num(contributions.goals.get(a));
        if (goalDiff) return goalDiff;
        const assistDiff = num(contributions.assists.get(b)) - num(contributions.assists.get(a));
        if (assistDiff) return assistDiff;
        return num(minutes[b]) - num(minutes[a]);
      })[0] || null;
  }

  function recalc(record) {
    record.averageRating = record.ratedApps ? Number((record.ratingTotal / record.ratedApps).toFixed(2)) : null;
    record.competitive.averageRating = record.competitive.ratedApps
      ? Number((record.competitive.ratingTotal / record.competitive.ratedApps).toFixed(2))
      : null;
  }

  async function recordCompletedMatch(event) {
    if (processing) return;
    processing = true;
    try {
      const c = career();
      const db = await loadDb();
      if (!c || !db) return;
      const state = ensureState(c);
      if (!state) return;

      const eventFixtureId = event?.detail?.fixtureId || null;
      const snapshot = window.__flmLiveStateV332 || window.__flmLiveState || null;
      if (!snapshot?.fixtureId || (eventFixtureId && snapshot.fixtureId !== eventFixtureId)) return;
      const fixtureId = String(snapshot.fixtureId);
      if (state.processedFixtureIds.includes(fixtureId)) return;

      const side = c.clubId === snapshot.homeClubId ? 'home' : c.clubId === snapshot.awayClubId ? 'away' : null;
      if (!side) return;
      const fixture = locateFixture(c, snapshot.fixtureId);
      const friendly = isFriendly(fixture);
      const starters = new Set(side === 'home' ? (snapshot.initialHomeLineupIds || []) : (snapshot.initialAwayLineupIds || []));
      const ownClubId = c.clubId;
      const opponentId = side === 'home' ? snapshot.awayClubId : snapshot.homeClubId;
      const result = resultFor(snapshot, side);
      const contributions = contributionMaps(snapshot.events || []);
      const motmId = bestPlayerId(snapshot, contributions);
      const minutes = snapshot.minutesPlayed || {};
      const userIds = new Set([
        ...(side === 'home' ? (snapshot.initialHomeLineupIds || []) : (snapshot.initialAwayLineupIds || [])),
        ...(side === 'home' ? (snapshot.homeLineupIds || []) : (snapshot.awayLineupIds || [])),
        ...Object.keys(minutes).filter(id => db.players?.find(player => player.id === id)?.clubId === ownClubId)
      ]);

      for (const playerId of userIds) {
        const playedMinutes = Math.round(num(minutes[playerId]));
        if (playedMinutes <= 0) continue;
        const player = db.players?.find(item => item.id === playerId);
        if (!player) continue;
        const rating = Number(snapshot.ratings?.[playerId]);
        const hasRating = Number.isFinite(rating);
        const started = starters.has(playerId);
        const goals = num(contributions.goals.get(playerId));
        const assists = num(contributions.assists.get(playerId));
        const yellowCards = num(contributions.yellows.get(playerId));
        const redCards = num(contributions.reds.get(playerId));
        const record = playerRecord(state, playerId, ownClubId);

        record.apps += 1;
        record.starts += started ? 1 : 0;
        record.subApps += started ? 0 : 1;
        record.minutes += playedMinutes;
        record.goals += goals;
        record.assists += assists;
        record.yellowCards += yellowCards;
        record.redCards += redCards;
        record.manOfMatch += motmId === playerId ? 1 : 0;
        if (hasRating) {
          record.ratingTotal += rating;
          record.ratedApps += 1;
        }

        if (!friendly) {
          record.competitive.apps += 1;
          record.competitive.starts += started ? 1 : 0;
          record.competitive.minutes += playedMinutes;
          record.competitive.goals += goals;
          record.competitive.assists += assists;
          if (hasRating) {
            record.competitive.ratingTotal += rating;
            record.competitive.ratedApps += 1;
          }
        }

        const matchEntry = {
          fixtureId,
          date:fixture?.date || c.currentDate || null,
          competition:fixture?.competitionName || (friendly ? 'Friendly' : c.competitionName || 'Competition'),
          friendly,
          opponentClubId:opponentId,
          venue:side === 'home' ? 'H' : 'A',
          result:result.result,
          score:result.score,
          started,
          minutes:playedMinutes,
          goals,
          assists,
          yellowCards,
          redCards,
          rating:hasRating ? Number(rating.toFixed(1)) : null,
          condition:Number.isFinite(Number(snapshot.conditions?.[playerId])) ? Math.round(Number(snapshot.conditions[playerId])) : null,
          manOfMatch:motmId === playerId
        };
        record.matches.push(matchEntry);
        if (record.matches.length > MAX_MATCHES) record.matches = record.matches.slice(-MAX_MATCHES);
        if (hasRating) {
          record.recentRatings.push({
            fixtureId,
            rating:Number(rating.toFixed(1)),
            opponentClubId:opponentId,
            result:result.result,
            score:result.score,
            date:matchEntry.date,
            friendly
          });
          if (record.recentRatings.length > 5) record.recentRatings = record.recentRatings.slice(-5);
        }
        recalc(record);

        c.playerStatus ||= {};
        const status = c.playerStatus[playerId] ||= {};
        if (matchEntry.condition != null) status.condition = matchEntry.condition;
        if (hasRating) {
          status.lastRating = Number(rating.toFixed(1));
          status.form = formLabel(record.recentRatings);
          status.morale = nextMorale(status.morale || player.status?.morale || 'Good', rating, result.result);
        }
      }

      state.processedFixtureIds.push(fixtureId);
      if (state.processedFixtureIds.length > 60) state.processedFixtureIds = state.processedFixtureIds.slice(-60);
      state.updatedAt = new Date().toISOString();
      persist(c);
      document.dispatchEvent(new CustomEvent('flm:player-performance-updated', { detail:{ fixtureId, season:state.season } }));
      queue();
    } finally {
      processing = false;
    }
  }

  function ratingTone(value) {
    const rating = Number(value);
    if (!Number.isFinite(rating)) return '';
    if (rating >= 8) return 'is-elite';
    if (rating >= 7) return 'is-good';
    if (rating < 6) return 'is-poor';
    return 'is-average';
  }

  function statusTone(value, type) {
    if (type === 'condition' || type === 'sharpness') {
      const n = num(value);
      return n >= 80 ? 'is-positive' : n < 65 ? 'is-poor' : 'is-warning';
    }
    const text = String(value || '').toLowerCase();
    if (/excellent|very good|good/.test(text)) return 'is-positive';
    if (/poor|very poor|low|very low/.test(text)) return 'is-poor';
    return '';
  }

  function clubName(db, id) {
    const club = db?.clubs?.find(item => item.id === id);
    return club?.shortName || club?.name || 'Opponent';
  }

  function displayRecord(c, playerId) {
    const state = ensureState(c);
    return state?.players?.[playerId] || emptyPlayerRecord(playerId, c?.clubId || null);
  }

  function performanceMarkup(c, db, playerId) {
    const state = ensureState(c);
    const record = displayRecord(c, playerId);
    const status = c?.playerStatus?.[playerId] || {};
    const recent = [...(record.recentRatings || [])].reverse();
    const avg = record.averageRating;
    const sharpness = status.sharpness ?? db.players?.find(item => item.id === playerId)?.status?.matchSharpness ?? 90;
    const condition = status.condition ?? 100;
    const morale = status.morale || 'Good';
    const form = status.form || formLabel(record.recentRatings);

    return `<div class="flm-perf-head"><strong>${esc(state.season)} PERFORMANCE</strong><span>UPDATED AFTER EVERY MATCH</span></div>
      <div class="flm-perf-stats">
        <div class="flm-perf-stat"><span>Apps</span><strong>${record.apps}</strong></div>
        <div class="flm-perf-stat"><span>Starts</span><strong>${record.starts}</strong></div>
        <div class="flm-perf-stat"><span>Goals</span><strong>${record.goals}</strong></div>
        <div class="flm-perf-stat"><span>Assists</span><strong>${record.assists}</strong></div>
        <div class="flm-perf-stat"><span>Avg Rating</span><strong class="${ratingTone(avg)}">${avg == null ? '—' : Number(avg).toFixed(2)}</strong></div>
        <div class="flm-perf-stat"><span>Player of Match</span><strong>${record.manOfMatch}</strong></div>
      </div>
      <div class="flm-perf-body">
        <div class="flm-perf-recent"><span class="flm-perf-section-label">LAST 5 MATCH RATINGS</span>${recent.length ? `<div class="flm-perf-ratings">${recent.map(item => `<div class="flm-perf-rating ${ratingTone(item.rating)}"><b>${Number(item.rating).toFixed(1)}</b><small>${esc(item.venue || '')}${esc(clubName(db,item.opponentClubId))} · ${esc(item.result)} ${esc(item.score)}</small></div>`).join('')}</div>` : '<div class="flm-perf-empty">No match ratings yet. Ratings appear here immediately after full time.</div>'}</div>
        <div class="flm-perf-status">
          <div><span>Form</span><strong class="${statusTone(form,'form')}">${esc(form)}</strong></div>
          <div><span>Morale</span><strong class="${statusTone(morale,'morale')}">${esc(morale)}</strong></div>
          <div><span>Condition</span><strong class="${statusTone(condition,'condition')}">${esc(condition)}%</strong></div>
          <div><span>Sharpness</span><strong class="${statusTone(sharpness,'sharpness')}">${esc(sharpness)}%</strong></div>
        </div>
      </div>`;
  }

  function profileSignature(c, playerId) {
    const state = ensureState(c);
    const record = state?.players?.[playerId];
    const status = c?.playerStatus?.[playerId] || {};
    return JSON.stringify([state?.season,record?.apps,record?.starts,record?.goals,record?.assists,record?.averageRating,record?.manOfMatch,record?.recentRatings,status.form,status.morale,status.condition,status.sharpness]);
  }

  function decorateProfile(root, c, db, playerId) {
    root.classList.add('flm-performance-enhanced');
    const card = root.querySelector('.flm-ip-season-card');
    if (!card) return;
    const signature = profileSignature(c, playerId);
    if (card.dataset.flmPerfSignature === signature) return;
    card.dataset.flmPerfSignature = signature;
    card.classList.add('flm-perf-card');
    card.innerHTML = performanceMarkup(c, db, playerId);
  }

  function formMarkup(c, db, playerId) {
    const state = ensureState(c);
    const record = displayRecord(c, playerId);
    const status = c?.playerStatus?.[playerId] || {};
    const matches = [...(record.matches || [])].reverse().slice(0, 10);
    return `<div class="flm-perf-form-shell" data-flm-performance-form="${esc(playerId)}">
      <div class="flm-perf-form-summary">
        <div><span>FORM</span><strong>${esc(status.form || formLabel(record.recentRatings))}</strong></div>
        <div><span>MORALE</span><strong>${esc(status.morale || 'Good')}</strong></div>
        <div><span>CONDITION</span><strong>${esc(status.condition ?? 100)}%</strong></div>
        <div><span>AVG RATING</span><strong>${record.averageRating == null ? '—' : Number(record.averageRating).toFixed(2)}</strong></div>
        <div><span>MINUTES</span><strong>${record.minutes}</strong></div>
      </div>
      <section class="flm-ip-card"><div class="flm-ip-card-title">RECENT MATCHES</div>${matches.length ? `<div class="flm-ip-table-wrap"><table class="flm-perf-match-table"><thead><tr><th>Opponent</th><th>Comp</th><th>V</th><th>Result</th><th>Min</th><th>G</th><th>A</th><th>Rating</th></tr></thead><tbody>${matches.map(match => `<tr><td>${esc(clubName(db,match.opponentClubId))}</td><td>${esc(match.friendly ? 'Friendly' : match.competition || 'Competition')}</td><td>${esc(match.venue)}</td><td><span class="flm-perf-result ${match.result === 'W' ? 'win' : match.result === 'L' ? 'loss' : 'draw'}">${esc(match.result)} ${esc(match.score)}</span></td><td>${esc(match.minutes)}</td><td>${esc(match.goals)}</td><td>${esc(match.assists)}</td><td><span class="rating ${ratingTone(match.rating)}">${match.rating == null ? '—' : Number(match.rating).toFixed(1)}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="flm-ip-empty">No matches recorded yet.</div>'}</section>
    </div>`;
  }

  function decorateForm(root, c, db, playerId) {
    const panel = root.querySelector('[data-flm-profile-panel]');
    if (!panel) return;
    const signature = `form:${profileSignature(c,playerId)}`;
    if (panel.dataset.flmPerfFormSignature === signature) return;
    panel.dataset.flmPerfFormSignature = signature;
    panel.innerHTML = formMarkup(c, db, playerId);
  }

  function historyMarkup(c, db, playerId) {
    const state = ensureState(c);
    const rows = (state?.history || [])
      .map(entry => ({ season:entry.season, record:entry.players?.[playerId] }))
      .filter(entry => entry.record && num(entry.record.apps) > 0);
    if (!rows.length) return '';
    return `<section class="flm-perf-history-card" data-flm-performance-history="${esc(playerId)}"><div class="flm-ip-card-title">FOOTBALL LAB SEASON RECORD</div><div class="flm-ip-table-wrap"><table class="flm-perf-history-table"><thead><tr><th>Season</th><th>Club</th><th>Apps</th><th>Starts</th><th>Goals</th><th>Assists</th><th>Avg</th><th>POM</th></tr></thead><tbody>${rows.map(({season,record}) => `<tr><td>${esc(season)}</td><td>${esc(clubName(db,record.clubId))}</td><td>${esc(record.competitive?.apps ?? record.apps ?? 0)}</td><td>${esc(record.competitive?.starts ?? record.starts ?? 0)}</td><td>${esc(record.competitive?.goals ?? record.goals ?? 0)}</td><td>${esc(record.competitive?.assists ?? record.assists ?? 0)}</td><td>${record.competitive?.averageRating == null ? '—' : Number(record.competitive.averageRating).toFixed(2)}</td><td>${esc(record.manOfMatch ?? 0)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function decorateHistory(root, c, db, playerId) {
    const panel = root.querySelector('[data-flm-profile-panel]');
    if (!panel || panel.querySelector(`[data-flm-performance-history="${CSS.escape(playerId)}"]`)) return;
    const markup = historyMarkup(c, db, playerId);
    if (markup) panel.insertAdjacentHTML('afterbegin', markup);
  }

  async function syncUi() {
    queued = false;
    ensureStyles();
    const c = career();
    const root = document.querySelector('.career-app.is-open .flm-instant-profile');
    const playerId = window.FLMPlayerProfile?.activePlayerId;
    if (!c || !root || !playerId) return;
    const db = await loadDb();
    if (!db) return;
    ensureState(c);
    const tab = root.querySelector('[data-flm-profile-tab].is-active')?.dataset.flmProfileTab || 'profile';
    if (tab === 'profile') decorateProfile(root,c,db,playerId);
    if (tab === 'form') decorateForm(root,c,db,playerId);
    if (tab === 'history') decorateHistory(root,c,db,playerId);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => syncUi().catch(error => console.warn('FLM player performance UI failed:', error)));
  }

  ensureStyles();
  window.addEventListener('flm:live-state-complete', recordCompletedMatch);
  document.addEventListener('flm:live-state-complete', recordCompletedMatch);
  document.addEventListener('flm:player-performance-updated', queue);
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete','flm:career-tab-changed']
    .forEach(name => document.addEventListener(name, () => { const c = career(); if (c) ensureState(c); queue(); }));
  document.addEventListener('click', event => {
    if (event.target.closest('[data-flm-profile-tab],[data-player-profile],[data-flm-profile-player]')) queue();
  }, true);
  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  queue();

  window.FLMPlayerPerformance = Object.freeze({
    version:VERSION,
    refresh:queue,
    get(playerId) {
      const c = career();
      return c ? displayRecord(c, playerId) : null;
    },
    form(playerId) {
      const c = career();
      const record = c ? displayRecord(c, playerId) : null;
      return record ? formLabel(record.recentRatings) : '—';
    }
  });
})();
