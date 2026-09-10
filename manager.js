/*
 * Football Lab Manager public runtime entrypoint.
 *
 * Keep this file deliberately small. Runtime ownership and legacy ordering
 * live in manager-runtime-v1.js while the project is consolidated into
 * authoritative domain modules.
 */

import './manager-runtime-v1.js?v=1.1.0';
import './profile-preload-v1.js?v=1.0.0';
import './player-profile-fast-v1.js?v=1.0.1';
