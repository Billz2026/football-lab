/*
 * Football Lab Manager runtime manifest — consolidation pass v1.
 *
 * This is now the single runtime composition root.
 * Each import below owns one contiguous domain slice of the legacy bootstrap
 * so behaviour and evaluation order remain unchanged while the internals are
 * progressively merged into canonical modules.
 */

import './runtime-foundation-v1.js?v=1.0.0';
import './runtime-matchday-v1.js?v=1.0.0';
import './runtime-match-centre-v1.js?v=1.0.0';
import './runtime-career-integrity-v1.js?v=1.0.0';
import './runtime-commentary-v1.js?v=1.0.0';
