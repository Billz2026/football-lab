import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCalendarDays,
  deriveSeasonCalendar,
  seasonLabelFromYear,
  seasonStartYear
} from '../season-calendar-v1.js';

test('base 2026/27 calendar preserves the established V0.6 dates', () => {
  const calendar = deriveSeasonCalendar({ season: '2026/27', seasonStartDate: '2026-08-21' });
  assert.equal(calendar.offseasonStartDate, '2026-06-05');
  assert.equal(calendar.transferWindowOpenDate, '2026-06-15');
  assert.equal(calendar.fixtureReleaseDate, '2026-06-19');
  assert.deepEqual(calendar.preseasonFriendlyDates, ['2026-07-11', '2026-07-18', '2026-07-25', '2026-08-01', '2026-08-08']);
  assert.equal(calendar.seasonStartDate, '2026-08-21');
  assert.equal(calendar.transferDeadlineDate, '2026-09-01');
  assert.equal(calendar.transferClosedDate, '2026-09-02');
});

test('2027/28 calendar derives the new year rather than carrying 2026 constants forward', () => {
  const calendar = deriveSeasonCalendar({
    season: '2027/28',
    previousSeasonEndDate: '2027-05-30',
    seasonStartDate: '2027-08-20'
  });
  assert.equal(calendar.offseasonStartDate, '2027-05-31');
  assert.equal(calendar.transferWindowOpenDate, '2027-06-15');
  assert.equal(calendar.fixtureReleaseDate, '2027-06-19');
  assert.deepEqual(calendar.preseasonFriendlyDates, ['2027-07-10', '2027-07-17', '2027-07-24', '2027-07-31', '2027-08-07']);
  assert.equal(calendar.seasonStartDate, '2027-08-20');
  assert.equal(calendar.transferDeadlineDate, '2027-09-01');
  assert.equal(calendar.transferClosedDate, '2027-09-02');
});

test('later season labels and calendar arithmetic are generic rather than limited to 2027', () => {
  assert.equal(seasonStartYear('2034/35'), 2034);
  assert.equal(seasonLabelFromYear(2034), '2034/35');
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29');
  const calendar = deriveSeasonCalendar({ season: '2034/35' });
  assert.equal(calendar.transferWindowOpenDate, '2034-06-15');
  assert.equal(calendar.transferDeadlineDate, '2034-09-01');
  assert.equal(calendar.preseasonFriendlyDates.length, 5);
  assert.ok(calendar.preseasonFriendlyDates.every(date => new Date(`${date}T12:00:00Z`).getUTCDay() === 6));
});

test('invalid season labels fail rather than silently producing a corrupt calendar', () => {
  assert.equal(seasonStartYear('bad-season'), null);
  assert.equal(seasonLabelFromYear(Number.NaN), null);
  assert.throws(() => deriveSeasonCalendar({ season: 'bad-season' }), /Invalid season label/);
});
