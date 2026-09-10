/* Football Lab Manager — dense player profile enhancement v2
 * Championship Manager-inspired information density without copying the legacy UI.
 * Presentation only: no player ability or match simulation changes.
 */
(() => {
  'use strict';

  const VERSION = '2.0.0';
  const STYLE_URL = './player-profile-cm-v1.css?v=1.0.0';
  let dbPromise = null;
  let queued = false;

  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const COUNTRY_NAMES = Object.freeze({
    ENG:'England',SCO:'Scotland',WAL:'Wales',NIR:'Northern Ireland',IRL:'Republic of Ireland',
    FRA:'France',ESP:'Spain',GER:'Germany',DEU:'Germany',ITA:'Italy',POR:'Portugal',NED:'Netherlands',
    BEL:'Belgium',DEN:'Denmark',NOR:'Norway',SWE:'Sweden',POL:'Poland',CRO:'Croatia',SRB:'Serbia',
    TUR:'Türkiye',MAR:'Morocco',NGA:'Nigeria',GHA:'Ghana',SEN:'Senegal',RSA:'South Africa',
    BRA:'Brazil',ARG:'Argentina',URU:'Uruguay',COL:'Colombia',MEX:'Mexico',USA:'United States',
    CAN:'Canada',JPN:'Japan',KOR:'South Korea',AUS:'Australia',SUI:'Switzerland',AUT:'Austria'
  });

  function database() {
    if (!dbPromise && manager()?.loadDatabase) dbPromise = Promise.resolve(manager().loadDatabase()).catch(() => null);
    return dbPromise || Promise.resolve(null);
  }

  function ensureStyles() {
    if (document.querySelector('link[data-flm-cm-profile]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_URL;
    link.dataset.flmCmProfile = VERSION;
    document.head.appendChild(link);
  }

  function fullName(player) {
    const first = String(player?.firstName || '').trim();
    const last = String(player?.lastName || '').trim();
    return first && last ? `${first} ${last}` : String(player?.name || 'Unknown player').trim();
  }

  function nationality(player) {
    const raw = String(player?.nationality || player?.nationalityCode || '').trim();
    return COUNTRY_NAMES[raw.toUpperCase()] || raw || '—';
  }

  function ageFor(player, snapshot='2026-09-04') {
    if (player?.dateOfBirth) {
      const dob = new Date(`${player.dateOfBirth}T00:00:00Z`);
      const ref = new Date(`${snapshot}T00:00:00Z`);
      if (!Number.isNaN(dob.getTime()) && !Number.isNaN(ref.getTime())) {
        let age = ref.getUTCFullYear() - dob.getUTCFullYear();
        if (ref.getUTCMonth() < dob.getUTCMonth() || (ref.getUTCMonth() === dob.getUTCMonth() && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
        return age;
      }
    }
    const reported = Number(player?.reportedAge);
    return Number.isFinite(reported) ? reported : null;
  }

  function statusFor(player) {
    const runtime = career()?.playerStatus?.[player.id] || {};
    const base = player?.status || {};
    return {
      condition: runtime.condition ?? base.condition ?? 100,
      sharpness: runtime.sharpness ?? base.matchSharpness ?? 90,
      morale: runtime.morale ?? base.morale ?? 'Good',
      form: runtime.form ?? base.form ?? '—',
      injury: runtime.alert || base.injuries || 'None',
      suspension: base.suspension || 'None'
    };
  }

  function positiveStatus(value, type) {
    if (type === 'condition' || type === 'sharpness') return Number(value) >= 75;
    if (type === 'morale') return /superb|excellent|very good|good|high/i.test(String(value));
    if (type === 'injury' || type === 'suspension') return /none|fit|clear/i.test(String(value));
    return false;
  }

  function stateCell(label, value, type) {
    return `<div class="flm-cm-state"><span>${esc(label)}</span><strong class="${positiveStatus(value,type)?'is-positive':''}">${esc(value)}</strong></div>`;
  }

  function factCell(label, value) {
    return `<div class="flm-cm-fact"><span>${esc(label)}</span><strong>${esc(value ?? '—')}</strong></div>`;
  }

  function metaSignature(player, db) {
    const state = statusFor(player);
    return JSON.stringify([
      state.condition,state.sharpness,state.morale,state.form,state.injury,state.suspension,
      ageFor(player, db.metadata?.snapshotDate || '2026-09-04'),nationality(player),
      player.preferredFoot,player.heightCm,player.weightKg,player.primaryPosition,...(player.secondaryPositions || [])
    ]);
  }

  function profileMeta(player, db, signature) {
    const state = statusFor(player);
    const age = ageFor(player, db.metadata?.snapshotDate || '2026-09-04');
    const positions = [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean);
    return `<section class="flm-cm-profile-meta" data-flm-cm-profile-meta data-flm-cm-signature="${esc(signature)}">
      <div class="flm-cm-meta-group">
        <div class="flm-cm-meta-title">MATCH STATUS</div>
        <div class="flm-cm-state-grid">
          ${stateCell('Condition', `${state.condition}%`, 'condition')}
          ${stateCell('Morale', state.morale, 'morale')}
          ${stateCell('Sharpness', `${state.sharpness}%`, 'sharpness')}
          ${stateCell('Form', state.form, 'form')}
          ${stateCell('Injury', state.injury, 'injury')}
          ${stateCell('Suspension', state.suspension, 'suspension')}
        </div>
      </div>
      <div class="flm-cm-meta-group">
        <div class="flm-cm-meta-title">PLAYER DETAILS</div>
        <div class="flm-cm-fact-grid">
          ${factCell('Age', age)}
          ${factCell('Nationality', nationality(player))}
          ${factCell('Preferred foot', String(player.preferredFoot || 'Unknown').replace(/^./, c=>c.toUpperCase()))}
          ${factCell('Height / Weight', `${player.heightCm ? `${player.heightCm} cm` : '—'} · ${player.weightKg ? `${player.weightKg} kg` : '—'}`)}
        </div>
      </div>
      <div class="flm-cm-meta-group">
        <div class="flm-cm-meta-title">POSITIONS</div>
        <div class="flm-cm-position-wrap">${positions.length ? positions.map(position=>`<span>${esc(position)}</span>`).join('') : '<span>—</span>'}</div>
      </div>
    </section>`;
  }

  function setText(node, value) {
    if (node && node.textContent !== String(value)) node.textContent = String(value);
  }

  function enhanceHeader(root, player, db) {
    root.classList.add('flm-cm-profile');
    const header = root.querySelector('.flm-ip-header');
    const title = root.querySelector('.flm-ip-title');
    if (!header || !title) return;

    let number = header.querySelector('.flm-cm-number');
    if (!number) {
      number = document.createElement('div');
      number.className = 'flm-cm-number';
      number.innerHTML = '<strong class="flm-cm-number-value"></strong><span class="flm-cm-number-label"></span>';
      header.insertBefore(number, title);
    }
    const assigned = Number.isInteger(Number(player.shirtNumber)) && Number(player.shirtNumber) > 0;
    number.classList.toggle('is-unassigned', !assigned);
    setText(number.querySelector('.flm-cm-number-value'), assigned ? Number(player.shirtNumber) : '');
    setText(number.querySelector('.flm-cm-number-label'), assigned ? 'SQUAD NUMBER' : 'NUMBER UNASSIGNED');

    const heading = title.querySelector('h2');
    setText(heading, fullName(player));

    const original = title.querySelector('.flm-ip-subline:not(.flm-cm-subline)');
    if (original && !original.hidden) original.hidden = true;
    let subline = title.querySelector('.flm-cm-subline');
    if (!subline) {
      subline = document.createElement('div');
      subline.className = 'flm-ip-subline flm-cm-subline';
      title.appendChild(subline);
    }
    const club = db.clubs?.find(item => item.id === player.clubId);
    const age = ageFor(player, db.metadata?.snapshotDate || '2026-09-04');
    setText(subline, [club?.name || 'Unattached', player.primaryPosition || player.positionGroup || '—', nationality(player), age != null ? `Age ${age}` : null].filter(Boolean).join(' · '));
  }

  function enhanceProfileTab(root, player, db) {
    const panel = root.querySelector('[data-flm-profile-panel]');
    const grid = panel?.querySelector('.flm-ip-profile-grid');
    if (!panel || !grid) return;
    const signature = metaSignature(player, db);
    const meta = panel.querySelector('[data-flm-cm-profile-meta]');
    if (!meta) {
      grid.insertAdjacentHTML('beforebegin', profileMeta(player, db, signature));
      return;
    }
    if (meta.dataset.flmCmSignature !== signature) {
      const template = document.createElement('template');
      template.innerHTML = profileMeta(player, db, signature).trim();
      meta.replaceWith(template.content.firstElementChild);
    }
  }

  function currentSeasonLabel(c) {
    const explicit = c?.season?.label || c?.seasonLabel || c?.currentSeason;
    if (explicit) return String(explicit);
    const date = String(c?.currentDate || '2026-06-05');
    const year = /^\d{4}/.test(date) ? Number(date.slice(0,4)) : 2026;
    return `${year}/${String(year+1).slice(-2)}`;
  }

  function totalsFor(player) {
    const rows = Array.isArray(player?.seasonStats) ? player.seasonStats : [];
    return rows.reduce((total,row) => ({
      apps:total.apps + (Number(row.apps) || 0),
      goals:total.goals + (Number(row.goals) || 0),
      assists:total.assists + (Number(row.assists) || 0)
    }), {apps:0,goals:0,assists:0});
  }

  function historyRows(player) {
    return (Array.isArray(player?.careerHistory) ? player.careerHistory : []).map(item => ({
      season:item.season || item.year || item.from || '—',
      club:item.clubName || item.club || item.team || '—',
      apps:item.apps ?? item.appearances ?? '—',
      goals:item.goals ?? '—',
      assists:item.assists ?? '—',
      rating:item.averageRating ?? item.rating ?? '—'
    }));
  }

  function transferRows(player, db) {
    const rows = (career()?.transfers?.completed || []).filter(move => move?.playerId === player.id);
    return rows.map(move => ({
      from:db.clubs?.find(club => club.id === move.fromClubId)?.name || move.fromClubId || 'Unknown club',
      to:db.clubs?.find(club => club.id === move.toClubId)?.name || move.toClubId || 'Unknown club',
      fee:Number.isFinite(Number(move.fee)) ? Number(move.fee) : null
    }));
  }

  function money(value) {
    if (!Number.isFinite(Number(value))) return 'Fee not recorded';
    return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number(value));
  }

  function historyMarkup(player, db) {
    const c = career();
    const club = db.clubs?.find(item => item.id === player.clubId);
    const totals = totalsFor(player);
    const imported = historyRows(player);
    const moves = transferRows(player, db);
    const season = currentSeasonLabel(c);
    const tableRows = [...imported, {
      season,
      club:club?.name || 'Unattached',
      apps:totals.apps,
      goals:totals.goals,
      assists:totals.assists,
      rating:'—'
    }];
    const loadedApps = imported.reduce((sum,row)=>sum+(Number(row.apps)||0),0) + totals.apps;
    const loadedGoals = imported.reduce((sum,row)=>sum+(Number(row.goals)||0),0) + totals.goals;

    return `<div class="flm-cm-history-shell" data-flm-cm-history="${esc(player.id)}">
      <div class="flm-cm-history-summary">
        <div class="flm-cm-history-current"><span>Current club</span><strong>${esc(club?.name || 'Unattached')}</strong><em>${esc(season)} · ${esc(player.primaryPosition || player.positionGroup || '—')}</em></div>
        <div class="flm-cm-history-note"><span>Career appearances loaded</span><strong>${esc(loadedApps)}</strong><em>Recorded data only</em></div>
        <div class="flm-cm-history-note"><span>Career goals loaded</span><strong>${esc(loadedGoals)}</strong><em>Recorded data only</em></div>
      </div>
      <section class="flm-ip-card">
        <div class="flm-ip-card-title">CLUB HISTORY</div>
        <div class="flm-ip-table-wrap"><table class="flm-cm-history-table"><thead><tr><th>Season</th><th>Club</th><th>Apps</th><th>Goals</th><th>Assists</th><th>Avg</th></tr></thead><tbody>${tableRows.map(row=>`<tr><td>${esc(row.season)}</td><td>${esc(row.club)}</td><td>${esc(row.apps)}</td><td>${esc(row.goals)}</td><td>${esc(row.assists)}</td><td>${esc(row.rating)}</td></tr>`).join('')}</tbody></table></div>
      </section>
      ${moves.length ? `<section class="flm-ip-card"><div class="flm-ip-card-title">TRANSFER RECORD</div>${moves.map(move=>`<div class="flm-cm-transfer-row"><strong>${esc(move.from)}</strong><i>→</i><strong>${esc(move.to)}</strong><b>${esc(money(move.fee))}</b></div>`).join('')}</section>` : ''}
      ${imported.length ? '' : '<div class="flm-cm-data-note">PRE-CAREER HISTORY · The current source database does not contain season-by-season club history for this player. Football Lab will not invent missing clubs. Current-season records and every transfer completed inside your career are now recorded here automatically; historical source records will appear when factual backfill data is imported.</div>'}
    </div>`;
  }

  function enhanceHistoryTab(root, player, db) {
    const panel = root.querySelector('[data-flm-profile-panel]');
    if (!panel || panel.querySelector(`[data-flm-cm-history="${CSS.escape(player.id)}"]`)) return;
    panel.innerHTML = historyMarkup(player, db);
  }

  async function enhance() {
    queued = false;
    ensureStyles();
    const root = document.querySelector('.career-app.is-open .flm-instant-profile');
    const playerId = window.FLMPlayerProfile?.activePlayerId;
    if (!root || !playerId) return;
    const db = await database();
    if (!db) return;
    const player = db.players?.find(item => item.id === playerId);
    if (!player) return;

    enhanceHeader(root, player, db);
    const tab = root.querySelector('[data-flm-profile-tab].is-active')?.dataset.flmProfileTab || 'profile';
    if (tab === 'profile') enhanceProfileTab(root, player, db);
    if (tab === 'history') enhanceHistoryTab(root, player, db);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => enhance().catch(error => console.warn('FLM profile enhancement failed:', error)));
  }

  ensureStyles();
  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete','flm:squad-numbers-updated']
    .forEach(name => document.addEventListener(name, queue));
  document.addEventListener('click', event => {
    if (event.target.closest('[data-flm-profile-tab],[data-flm-profile-player],[data-player-profile]')) queue();
  }, true);
  queue();

  window.FLMPlayerProfileCM = Object.freeze({ version:VERSION, refresh:queue });
})();
