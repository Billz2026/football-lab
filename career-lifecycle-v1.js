export const CAREER_LIFECYCLE_SCHEMA_VERSION = 1;
export const MAX_CAREER_SEASONS = 40;
export const DEFAULT_CAREER_START_SEASON = '2026/27';

const clone = value => JSON.parse(JSON.stringify(value));

function seasonStartYear(label) {
  const match = /^(\d{4})\/(\d{2})$/.exec(String(label || ''));
  if (!match) return null;
  const start = Number(match[1]);
  const expectedEnd = (start + 1) % 100;
  if (Number(match[2]) !== expectedEnd) return null;
  return start;
}

export function seasonLabelFromStartYear(startYear) {
  if (!Number.isInteger(startYear)) return null;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function careerSeasonNumber(career) {
  const start = seasonStartYear(career?.careerStartSeason || DEFAULT_CAREER_START_SEASON);
  const current = seasonStartYear(career?.season);
  if (!Number.isInteger(start) || !Number.isInteger(current) || current < start) return null;
  return current - start + 1;
}

export function finalCareerSeasonLabel(career) {
  const start = seasonStartYear(career?.careerStartSeason || DEFAULT_CAREER_START_SEASON);
  return Number.isInteger(start) ? seasonLabelFromStartYear(start + MAX_CAREER_SEASONS - 1) : null;
}

function managedClubRows(career) {
  return (career?.seasonHistory || [])
    .map(record => {
      const row = (record?.finalTable || []).find(item => item?.clubId === career?.clubId);
      return row ? { record, row, position: record.finalTable.findIndex(item => item?.clubId === career?.clubId) + 1 } : null;
    })
    .filter(Boolean);
}

export function buildCareerSummary(career) {
  const rows = managedClubRows(career);
  const matches = rows.reduce((sum, item) => sum + Number(item.row.played || 0), 0);
  const wins = rows.reduce((sum, item) => sum + Number(item.row.won || 0), 0);
  const draws = rows.reduce((sum, item) => sum + Number(item.row.drawn || 0), 0);
  const losses = rows.reduce((sum, item) => sum + Number(item.row.lost || 0), 0);
  const leagueTitles = rows.filter(item => item.record?.championClubId === career?.clubId).length;
  const relegations = rows.filter(item => (item.record?.relegatedClubIds || []).includes(career?.clubId)).length;
  const highestLeagueFinish = rows.length ? Math.min(...rows.map(item => item.position).filter(position => position > 0)) : null;
  const seasonsCompleted = rows.length;
  const managerReputation = Number.isFinite(Number(career?.managerReputation))
    ? Number(career.managerReputation)
    : Number.isFinite(Number(career?.reputation)) ? Number(career.reputation) : null;

  // Until playable cups / multi-club management exist, these remain truthful zero/null values
  // instead of inventing honours or transfer records the save cannot prove.
  const promotions = Number(career?.careerStats?.promotions || 0);
  const domesticCups = Number(career?.careerStats?.domesticCups || 0);
  const europeanTrophies = Number(career?.careerStats?.europeanTrophies || 0);
  const biggestTransfer = career?.careerStats?.biggestTransfer ? clone(career.careerStats.biggestTransfer) : null;
  const clubsManaged = Array.isArray(career?.careerStats?.clubsManaged) && career.careerStats.clubsManaged.length
    ? [...new Set(career.careerStats.clubsManaged)]
    : career?.clubId ? [career.clubId] : [];
  const longestTenureSeasons = Number(career?.careerStats?.longestTenureSeasons || seasonsCompleted);
  const hallOfFameScore = leagueTitles * 100 + europeanTrophies * 150 + domesticCups * 50 + promotions * 35 + wins;

  return {
    schemaVersion: CAREER_LIFECYCLE_SCHEMA_VERSION,
    managerName: career?.managerName || null,
    careerStartSeason: career?.careerStartSeason || DEFAULT_CAREER_START_SEASON,
    finalSeason: career?.season || finalCareerSeasonLabel(career),
    seasonsCompleted,
    clubsManaged,
    matches,
    wins,
    draws,
    losses,
    winPercentage: matches ? Number(((wins / matches) * 100).toFixed(1)) : 0,
    leagueTitles,
    domesticCups,
    europeanTrophies,
    promotions,
    relegations,
    biggestTransfer,
    highestLeagueFinish,
    longestTenureSeasons,
    managerReputation,
    hallOfFameScore
  };
}

export function ensureCareerLifecycleState(career) {
  if (!career || typeof career !== 'object') return career;
  if (!career.careerStartSeason || !Number.isInteger(seasonStartYear(career.careerStartSeason))) {
    career.careerStartSeason = DEFAULT_CAREER_START_SEASON;
  }
  const seasonNumber = careerSeasonNumber(career);
  const finalSeason = finalCareerSeasonLabel(career);
  const retired = Boolean(career?.careerLifecycle?.status === 'retired' || career?.careerRetired);
  career.careerSeasonNumber = seasonNumber;
  career.maxCareerSeasons = MAX_CAREER_SEASONS;
  career.remainingSeasons = retired ? 0 : Number.isInteger(seasonNumber) ? Math.max(0, MAX_CAREER_SEASONS - seasonNumber + 1) : MAX_CAREER_SEASONS;
  career.rolloversRemaining = retired ? 0 : Number.isInteger(seasonNumber) ? Math.max(0, MAX_CAREER_SEASONS - seasonNumber) : MAX_CAREER_SEASONS - 1;
  career.isFinalCareerSeason = seasonNumber === MAX_CAREER_SEASONS;
  career.finalCareerSeason = finalSeason;
  career.careerLifecycle = {
    schemaVersion: CAREER_LIFECYCLE_SCHEMA_VERSION,
    status: retired ? 'retired' : 'active',
    startSeason: career.careerStartSeason,
    currentSeasonNumber: seasonNumber,
    maxSeasons: MAX_CAREER_SEASONS,
    finalSeason,
    remainingSeasons: career.remainingSeasons,
    rolloversRemaining: career.rolloversRemaining,
    isFinalSeason: career.isFinalCareerSeason,
    retiredAt: career?.careerLifecycle?.retiredAt || null
  };
  return career;
}

export function canRolloverCareer(career) {
  ensureCareerLifecycleState(career);
  if (career?.careerLifecycle?.status === 'retired') {
    return { ok: false, status: 'career-complete', reason: 'This 40-season managerial career is complete.' };
  }
  const number = careerSeasonNumber(career);
  if (!Number.isInteger(number)) return { ok: false, status: 'invalid-career-season', reason: 'The career season number could not be resolved.' };
  if (number >= MAX_CAREER_SEASONS) {
    return { ok: false, status: 'career-limit-reached', reason: `${career.season} is the 40th and final playable season.` };
  }
  return { ok: true, status: 'career-rollover-ready', currentSeasonNumber: number, nextSeasonNumber: number + 1 };
}

export function finaliseCareerIfLimitReached(career, { completedAt = new Date().toISOString() } = {}) {
  ensureCareerLifecycleState(career);
  const number = careerSeasonNumber(career);
  if (career?.status !== 'complete' || number !== MAX_CAREER_SEASONS || !career?.seasonOutcome) {
    return { status: 'career-active', career };
  }
  if (career?.careerLifecycle?.status === 'retired') {
    return { status: 'already-retired', career, summary: clone(career.careerSummary || buildCareerSummary(career)) };
  }

  const summary = buildCareerSummary(career);
  career.careerRetired = true;
  career.careerCompletedAt = completedAt;
  career.remainingSeasons = 0;
  career.rolloversRemaining = 0;
  career.isFinalCareerSeason = true;
  career.careerSummary = summary;
  career.careerLifecycle = {
    ...career.careerLifecycle,
    status: 'retired',
    remainingSeasons: 0,
    rolloversRemaining: 0,
    isFinalSeason: true,
    retiredAt: completedAt
  };
  return { status: 'retired', career, summary: clone(summary) };
}
