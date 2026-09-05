const SEASON_LABEL = '2026/27';
const stylesheetId = 'flm-season-v051-css';
if (!document.getElementById(stylesheetId)) {
  const link = document.createElement('link');
  link.id = stylesheetId;
  link.rel = 'stylesheet';
  link.href = './career-season-v051.css?v=0.5.1';
  document.head.appendChild(link);
}

let fixturesOpen = false;
let clubsPromise;

function readCareer() {
  try {
    return JSON.parse(localStorage.getItem('flm-career-save') || 'null');
  } catch {
    return null;
  }
}

function formatFixtureDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getUTCFullYear() === 2026 ? undefined : 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function clubMap() {
  if (!clubsPromise) {
    clubsPromise = fetch('./data/current/clubs.json?v=60', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('clubs unavailable')))
      .then(clubs => new Map(clubs.map(club => [club.id, club.name])))
      .catch(() => new Map());
  }
  return clubsPromise;
}

function userFixture(career, round) {
  return round?.find(fixture => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) || null;
}

function resultLabel(career, fixture) {
  if (!fixture?.played) return { text: fixture?.kickoffTime || '', className: '' };
  const home = fixture.homeClubId === career.clubId;
  const goalsFor = home ? fixture.homeGoals : fixture.awayGoals;
  const goalsAgainst = home ? fixture.awayGoals : fixture.homeGoals;
  return {
    text: `${goalsFor}–${goalsAgainst}`,
    className: goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw'
  };
}

async function renderFixturesPage() {
  const career = readCareer();
  const content = document.querySelector('.career-content');
  if (!career || !content || !fixturesOpen) return;
  const names = await clubMap();
  if (!fixturesOpen || !document.querySelector('.career-content')) return;

  const rows = career.fixtures.map((round, index) => {
    const fixture = userFixture(career, round);
    if (!fixture) return '';
    const home = fixture.homeClubId === career.clubId;
    const opponentId = home ? fixture.awayClubId : fixture.homeClubId;
    const result = resultLabel(career, fixture);
    const isNext = career.status !== 'complete' && index === career.roundIndex;
    return `<article class="v051-fixture-row ${fixture.played ? 'is-played' : ''} ${isNext ? 'is-next' : ''}">
      <div class="v051-mw">MW ${fixture.matchweek || fixture.round}</div>
      <div class="v051-date">${formatFixtureDate(fixture.date)}</div>
      <div class="v051-opponent"><span class="v051-ha">${home ? 'H' : 'A'}</span><b>${names.get(opponentId) || 'Opponent'}</b></div>
      <div class="v051-phase">${fixture.phase === 'return-leg' ? 'Return' : 'First leg'}</div>
      <div class="v051-result ${result.className}">${result.text}</div>
    </article>`;
  }).join('');

  const played = career.table?.find(row => row.clubId === career.clubId)?.played || career.roundIndex || 0;
  content.innerHTML = `<section class="v051-fixtures-page">
    <div class="v051-fixture-heading"><div><p class="eyebrow">${career.competitionName || 'FOOTBALL LAB PREMIER LEAGUE'}</p><h2>Fixtures & Results</h2></div><p>${SEASON_LABEL} · Home & away · 38 matches</p></div>
    <div class="v051-season-summary">
      <article><small>MATCHES</small><strong>${played} / ${career.fixtures.length}</strong></article>
      <article><small>HOME</small><strong>19</strong></article>
      <article><small>AWAY</small><strong>19</strong></article>
      <article><small>FINAL DAY</small><strong>30 MAY 2027</strong></article>
    </div>
    <div class="v051-fixture-list">${rows}</div>
  </section>`;
}

function ensureFixturesTab() {
  const nav = document.querySelector('.career-nav');
  if (!nav || nav.querySelector('[data-v051-fixtures]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `career-nav-button${fixturesOpen ? ' is-active' : ''}`;
  button.dataset.v051Fixtures = '1';
  button.textContent = 'Fixtures';
  const table = nav.querySelector('[data-career-tab="table"]');
  nav.insertBefore(button, table || null);
  button.addEventListener('click', () => {
    fixturesOpen = true;
    nav.querySelectorAll('.career-nav-button').forEach(item => item.classList.toggle('is-active', item === button));
    renderFixturesPage();
  });
}

function syncSeasonPresentation() {
  const heroNote = document.querySelector('.hero-note');
  if (heroNote) heroNote.textContent = 'FULL LEAGUE BETA · 20 CLUBS · 38 MATCHES';

  const version = document.querySelector('.version-chip');
  if (version) version.textContent = 'V0.5.1';
  const footerBuild = document.querySelector('.footer-build');
  if (footerBuild) footerBuild.textContent = 'V0.5.1 · FULL LEAGUE CAREER';

  ensureFixturesTab();

  const career = readCareer();
  const total = career?.fixtures?.length || 38;
  const current = Math.min((career?.roundIndex || 0) + 1, total);
  const next = career?.status === 'complete' ? null : userFixture(career, career?.fixtures?.[career?.roundIndex || 0]);

  document.querySelectorAll('.career-round').forEach(node => {
    node.textContent = node.textContent
      .replace(/ROUND\s+(\d+)\s+OF\s+(\d+)/i, 'MATCHWEEK $1 OF $2')
      .replace(/(\d+)\s*\/\s*(\d+)\s+ROUNDS/i, '$1 / $2 MATCHWEEKS');
  });

  document.querySelectorAll('.career-page-heading .eyebrow').forEach(node => {
    node.textContent = node.textContent.replace(/^ROUND\s+(\d+)/i, 'MATCHWEEK $1');
  });

  const nextMeta = document.querySelector('.career-next-match small');
  if (nextMeta && next) {
    const venue = nextMeta.textContent.split('·')[0]?.trim() || (next.homeClubId === career.clubId ? 'Home' : 'Away');
    const date = formatFixtureDate(next.date);
    nextMeta.textContent = [date, venue, `Matchweek ${next.matchweek || next.round}`].filter(Boolean).join(' · ');
  }

  const tableHeading = [...document.querySelectorAll('.career-page-heading .eyebrow')]
    .find(node => /FOOTBALL LAB INVITATIONAL/i.test(node.textContent));
  if (tableHeading) tableHeading.textContent = 'FOOTBALL LAB PREMIER LEAGUE';

  document.querySelectorAll('.career-complete h2').forEach(node => {
    if (/Invitational complete/i.test(node.textContent)) node.textContent = 'League season complete.';
  });
  document.querySelectorAll('.career-complete p').forEach(node => {
    if (/first playable management loop/i.test(node.textContent)) {
      node.textContent = `You completed the full ${SEASON_LABEL} 38-match league season.`;
    }
  });

  const modalTitle = document.getElementById('modalTitle');
  const modalCopy = document.getElementById('modalCopy');
  if (modalTitle?.textContent.trim() === 'CHOOSE YOUR CLUB' && modalCopy) {
    modalCopy.textContent = 'Begin a full 38-match league season. All 20 clubs play each other home and away.';
  }

  const modalBody = document.getElementById('modalBody');
  if (modalTitle?.textContent.trim() === 'LOAD GAME' && modalBody && career) {
    const paragraph = modalBody.querySelector('.notice-panel p');
    if (paragraph && /Round\s+\d+\s+of\s+\d+/i.test(paragraph.textContent)) {
      paragraph.textContent = career.status === 'complete'
        ? 'Season complete'
        : `Matchweek ${current} of ${total}`;
    }
  }

  if (modalTitle?.textContent.trim() === 'HALL OF FAME' && modalBody) {
    const paragraph = modalBody.querySelector('.notice-panel p');
    if (paragraph && /seven-match Invitational/i.test(paragraph.textContent)) {
      paragraph.textContent = 'Complete the 38-match league campaign and build a record worth keeping.';
    }
  }
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-career-tab]')) fixturesOpen = false;
});

let queued = false;
function queueSync() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    syncSeasonPresentation();
  });
}

syncSeasonPresentation();
new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true, characterData: true });
