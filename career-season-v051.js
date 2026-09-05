const SEASON_LABEL = '2026/27';

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

function syncSeasonPresentation() {
  const heroNote = document.querySelector('.hero-note');
  if (heroNote) heroNote.textContent = 'FULL LEAGUE BETA · 20 CLUBS · 38 MATCHES';

  const version = document.querySelector('.version-chip');
  if (version) version.textContent = 'V0.5.1';
  const footerBuild = document.querySelector('.footer-build');
  if (footerBuild) footerBuild.textContent = 'V0.5.1 · FULL LEAGUE CAREER';

  const career = readCareer();
  const total = career?.fixtures?.length || 38;
  const current = Math.min((career?.roundIndex || 0) + 1, total);
  const next = career?.status === 'complete' ? null : career?.fixtures?.[career?.roundIndex || 0]?.find(
    fixture => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId
  );

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
