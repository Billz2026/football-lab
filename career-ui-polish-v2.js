/* Football Lab Manager — career detail polish v2
 * Presentation/data-correction layer only. No match or save simulation logic changes.
 */
(() => {
  'use strict';

  let dbPromise = null;
  let queued = false;
  const COUNTRY_NAMES = Object.freeze({
    ENG:'England',SCO:'Scotland',WAL:'Wales',NIR:'Northern Ireland',IRL:'Republic of Ireland',
    FRA:'France',ESP:'Spain',GER:'Germany',DEU:'Germany',ITA:'Italy',POR:'Portugal',NED:'Netherlands',
    BEL:'Belgium',DEN:'Denmark',NOR:'Norway',SWE:'Sweden',POL:'Poland',CRO:'Croatia',SRB:'Serbia',
    TUR:'Türkiye',MAR:'Morocco',NGA:'Nigeria',GHA:'Ghana',SEN:'Senegal',RSA:'South Africa',
    BRA:'Brazil',ARG:'Argentina',URU:'Uruguay',COL:'Colombia',MEX:'Mexico',USA:'United States',
    CAN:'Canada',JPN:'Japan',KOR:'South Korea',AUS:'Australia',SUI:'Switzerland',AUT:'Austria'
  });

  function manager(){ return window.FLMManager || null; }
  function career(){ return manager()?.activeCareer || null; }
  function database(){
    if (!dbPromise && manager()?.loadDatabase) dbPromise = Promise.resolve(manager().loadDatabase()).catch(() => null);
    return dbPromise || Promise.resolve(null);
  }
  function fullName(player){
    const first = String(player?.firstName || '').trim();
    const last = String(player?.lastName || '').trim();
    return first && last ? `${first} ${last}` : String(player?.name || '').trim();
  }
  function nationality(player){
    const raw = String(player?.nationality || player?.nationalityCode || '').trim();
    return COUNTRY_NAMES[raw.toUpperCase()] || raw || '—';
  }
  function ageFor(player, snapshot='2026-09-04'){
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
  function playerById(db, id){ return db?.players?.find(player => player.id === id) || null; }

  function polishSquad(db){
    document.querySelectorAll('[data-v044-row]').forEach(row => {
      const player = playerById(db, row.dataset.v044Row);
      const name = row.querySelector('.v044-name strong');
      if (player && name && name.textContent !== fullName(player)) name.textContent = fullName(player);
    });
    document.querySelectorAll('.career-player-row').forEach(row => {
      const id = row.querySelector('[data-player-profile]')?.dataset.playerProfile || row.querySelector('[data-lineup-player]')?.value;
      const player = playerById(db, id);
      const name = row.querySelector('.career-player-name strong');
      if (player && name && name.textContent !== fullName(player)) name.textContent = fullName(player);
    });
  }

  function polishProfile(db){
    const root = document.querySelector('.career-app.is-open .flm-instant-profile');
    const id = window.FLMPlayerProfile?.activePlayerId;
    if (!root || !id) return;
    const player = playerById(db, id);
    if (!player) return;

    const title = root.querySelector('.flm-ip-title h2');
    if (title) title.textContent = fullName(player);

    const club = db.clubs?.find(item => item.id === player.clubId);
    const age = ageFor(player, db.metadata?.snapshotDate || '2026-09-04');
    const parts = [club?.name, player.primaryPosition, nationality(player), age != null ? `Age ${age}` : null, player.shirtNumber ? `#${player.shirtNumber}` : null].filter(Boolean);
    const subline = root.querySelector('.flm-ip-subline');
    if (subline) subline.textContent = parts.join(' · ');

    root.querySelectorAll('.flm-ip-attribute-row strong').forEach(node => {
      const value = Number(node.textContent.trim());
      if (!Number.isFinite(value)) return;
      node.dataset.polishTier = value >= 16 ? 'elite' : value >= 13 ? 'strong' : value >= 10 ? 'standard' : 'weak';
    });
  }

  function realisticManagerWage(c, db){
    const club = db?.clubs?.find(item => item.id === c?.clubId);
    const rawRep = Number(club?.reputation);
    const clubLevel = Number.isFinite(rawRep) ? (rawRep > 100 ? rawRep / 100 : rawRep) : 50;
    const experience = Number(c?.managerProfile?.startingReputation) || 50;
    return Math.round((9000 + clubLevel * 120 + experience * 140) / 500) * 500;
  }

  function fixManagerSalary(c, db){
    if (!c || !db) return;
    const wage = realisticManagerWage(c, db);
    if (!Number.isFinite(wage) || wage <= 0) return;
    let changed = false;
    const formatted = new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP', maximumFractionDigits:0 }).format(wage);
    const salaryPattern = /salary of £[\d,]+ per week/gi;

    const pools = [c.news, c.inbox, c.messages, c.careerNews, c.newsItems].filter(Array.isArray);
    pools.forEach(items => items.forEach(item => {
      if (typeof item?.body !== 'string') return;
      const next = item.body.replace(salaryPattern, `salary of ${formatted} per week`);
      if (next !== item.body) { item.body = next; changed = true; }
    }));

    document.querySelectorAll('.career-inbox-detail p').forEach(node => {
      const next = node.textContent.replace(salaryPattern, `salary of ${formatted} per week`);
      if (next !== node.textContent) node.textContent = next;
    });

    if (c.managerContract && Number(c.managerContract.weeklyWage) !== wage) {
      c.managerContract.weeklyWage = wage;
      changed = true;
    }
    if (c.managerProfile?.contract && Number(c.managerProfile.contract.weeklyWage) !== wage) {
      c.managerProfile.contract.weeklyWage = wage;
      changed = true;
    }

    if (changed) {
      try {
        c.updatedAt = new Date().toISOString();
        localStorage.setItem('flm-career-save', JSON.stringify(c));
      } catch {}
    }
  }

  async function sync(){
    queued = false;
    const db = await database();
    if (!db) return;
    polishSquad(db);
    polishProfile(db);
    fixManagerSalary(career(), db);
  }
  function queue(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './career-ui-polish-v2.css?v=2.0.0';
  link.dataset.flmCareerUiPolish = '2.0.0';
  document.head.appendChild(link);

  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete'].forEach(name => document.addEventListener(name, queue));
  queue();
})();
