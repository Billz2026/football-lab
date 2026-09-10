/*
 * Football Lab Manager public runtime entrypoint.
 *
 * Keep this file deliberately small. Runtime ownership and legacy ordering
 * live in manager-runtime-v1.js while the project is consolidated into
 * authoritative domain modules.
 */

import './manager-runtime-v1.js?v=1.1.0';
import './game-economy-v1.js?v=1.0.0';
import './squad-number-registration-v2.js?v=2.0.0';
import './squad-number-quickpick-v2.js?v=2.0.0';
import './career-shell-premium-v1.js?v=1.0.0';
import './profile-preload-v1.js?v=1.0.0';
import './player-profile-fast-v1.js?v=1.0.1';
import './profile-runtime-guard-v1.js?v=1.0.0';
import './interaction-hotfix-v1.js?v=1.0.3';
import './player-profile-warm-v1.js?v=1.0.1';
import './career-ui-polish-v2.js?v=2.0.1';
import './player-profile-cm-v2.js?v=2.0.0';
import './player-performance-v1.js?v=1.0.0';
