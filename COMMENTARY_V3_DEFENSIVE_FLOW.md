# Matchday Commentary V3 — Defensive Actions, Turnovers & Broken Attacks

## Objective
Make non-shot match commentary describe real structured football actions rather than generic possession filler.

## Engine contract
- Preserve calibrated goals, shots, shots on target, corners, fouls, cards, substitutions and injuries.
- Enrich existing non-shot events only; do not manufacture extra shots or goals.
- Every structured flow event receives a deterministic `sequenceId` and three beats: `development -> duel -> resolution`.
- Structured facts include attacking/defending club, attacker, creator, defender, goalkeeper, side, zone, pressure and possession outcome.

## Initial flow vocabulary
Interception, standing tackle, sliding tackle, poor touch, overhit pass, forced recycle, second-ball win, pressing regain, blocked cross, defensive header, goalkeeper claim, overhit cross, offside trap, defensive header to corner, blocked cross to corner and last-ditch block to corner.

## Narrative memory
The engine tags repeated defender interventions, repeated attacking breakdowns, pressure resisted, late-game lead protection and teams chasing the match. The authoritative V3 renderer can therefore describe recurring match stories rather than treating every incident in isolation.

## Presentation contract
The V3 renderer owns only `flow` events. V2 remains authoritative for structured shot sequences. Legacy commentary layers must not rewrite protected V3 rows.
