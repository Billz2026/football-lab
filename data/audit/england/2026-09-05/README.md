# Football Lab Manager — Premier League Full Audit

Snapshot date: 2026-09-05
Season: 2026/27
Scope: all 20 Premier League clubs in the playable Football Lab database.

## Source authority

1. Squad ownership / Premier League eligibility: official Premier League post-window squad lists published 2026-09-03.
2. Confirmed transfers and loans: official club / Premier League announcements take precedence over secondary databases.
3. Position, contract and reference market value: dated external benchmark (Transfermarkt used as the initial common benchmark), cross-checked where an official or statistical source materially disagrees.
4. Football Lab CA/PA and attributes remain FLM gameplay calibration. They are never presented as third-party ratings or objective real-world facts.

## Audit contract

Every senior / first-team-relevant player included in Football Lab must resolve to exactly one club or an explicit external/loan status. No senior player may remain `academy-depth-unreviewed` after this audit is complete.

Each audited record should contain:
- canonical name and aliases
- current club / parent club / loan status
- primary position
- secondary positions where evidenced
- position group
- shirt number where verified
- age / DOB where available from a reliable source
- nationality where available
- contract expiry where available
- dated reference market value and currency
- FLM importance / squad status
- FLM CA / PA calibration metadata
- source provenance and review date

## Valuation rule

`referenceMarketValue` is a dated external estimate, not an objective transfer fee.

`marketValue` in the game must be allowed to rise OR fall to the audited benchmark. Do not use the old V3 `Math.max(existing, audited)` rule.

Actual asking price / expected transfer fee must be generated separately from reference value using contract length, player importance, club finances, age, buyer/seller rivalry and market demand.

## Position taxonomy

Football Lab uses granular tactical positions rather than only GK/DEF/MID/ATT. Canonical positions include:
GK, DR, DL, DC, WBR, WBL, DMC, MC, MR, ML, AMC, AMR, AML, ST.

## Completion gate per club

A club is `complete` only when:
- official post-window squad membership reconciles
- stale departures are removed
- loans are correct
- every Football Lab first-team player is matched or explicitly resolved
- all primary positions are reviewed
- meaningful secondary positions are reviewed
- key-player hierarchy is reviewed
- reference values are present for all market-relevant first-team players
- no unresolved duplicate player identities remain
- QA reports zero senior ownership conflicts

The runtime database will not consume this audit layer until all 20 clubs pass the gate.