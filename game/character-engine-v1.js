import { activeCharacter } from "./characters-v13.js?v=32.4";
import {
  CHARACTER_PRODUCTION_BUILD_V1,
  CHARACTER_PRODUCTION_CONTRACT_V1,
  CHARACTER_ASSETS_V1,
  characterAssetBySourceIdV1,
  characterAssetV1,
  requiredClipsForAssetV1
} from "./character-production-v1.js?v=1.0.0";

let rendererAdapter = null;
let adapterName = null;

function validAdapter(candidate) {
  return Boolean(
    candidate &&
    typeof candidate.init === "function" &&
    typeof candidate.loadCharacter === "function" &&
    typeof candidate.render === "function" &&
    typeof candidate.dispose === "function"
  );
}

export function registerProductionCharacterRendererV1(name, candidate) {
  if (!validAdapter(candidate)) {
    throw new TypeError("Football Lab production character renderer must implement init, loadCharacter, render and dispose.");
  }
  rendererAdapter = candidate;
  adapterName = String(name || "production-renderer");
  return characterEngineSnapshotV1();
}

export function unregisterProductionCharacterRendererV1() {
  rendererAdapter = null;
  adapterName = null;
  return characterEngineSnapshotV1();
}

export function activeProductionCharacterAssetV1() {
  return characterAssetBySourceIdV1(activeCharacter().id) || characterAssetV1("viktor-kane");
}

export function productionRendererAvailableV1() {
  return Boolean(rendererAdapter);
}

export function characterEngineSnapshotV1() {
  const activeAsset = activeProductionCharacterAssetV1();
  const mode = rendererAdapter ? "production-3d" : "v42-fallback";
  return Object.freeze({
    build: CHARACTER_PRODUCTION_BUILD_V1,
    mode,
    adapter: adapterName,
    activeCharacter: activeAsset?.id || null,
    activeModel: activeAsset?.model || null,
    fallbackRenderer: CHARACTER_PRODUCTION_CONTRACT_V1.fallbackRenderer,
    liveIntegration: CHARACTER_PRODUCTION_CONTRACT_V1.liveIntegration,
    productionRendererAvailable: Boolean(rendererAdapter)
  });
}

export async function probeCharacterAssetV1(entryOrId, fetchImpl = globalThis.fetch) {
  const entry = typeof entryOrId === "string" ? characterAssetV1(entryOrId) : entryOrId;
  if (!entry) return Object.freeze({ ok: false, reason: "unknown-character", status: 0 });
  if (typeof fetchImpl !== "function") return Object.freeze({ ok: false, reason: "fetch-unavailable", status: 0 });

  try {
    const response = await fetchImpl(entry.model, { method: "HEAD", cache: "no-store" });
    return Object.freeze({
      ok: Boolean(response.ok),
      reason: response.ok ? "available" : "missing",
      status: Number(response.status) || 0,
      model: entry.model
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      reason: "request-failed",
      status: 0,
      model: entry.model,
      message: String(error?.message || error || "Unknown asset probe failure")
    });
  }
}

export function productionReadinessV1() {
  const entries = Object.values(CHARACTER_ASSETS_V1);
  const ready = entries.filter((entry) => entry.productionStatus === "ready");
  const awaiting = entries.filter((entry) => entry.productionStatus !== "ready");
  const mastersReady = ["viktor-kane", "mikkel-storm"].every(
    (id) => characterAssetV1(id)?.productionStatus === "ready"
  );
  return Object.freeze({
    build: CHARACTER_PRODUCTION_BUILD_V1,
    total: entries.length,
    ready: ready.length,
    awaiting: awaiting.length,
    mastersReady,
    canEnableLiveIntegration: mastersReady && awaiting.length === 0 && Boolean(rendererAdapter)
  });
}

export function validateCharacterAssetContractV1(entryOrId) {
  const entry = typeof entryOrId === "string" ? characterAssetV1(entryOrId) : entryOrId;
  if (!entry) return Object.freeze({ ok: false, errors: Object.freeze(["unknown-character"]) });

  const errors = [];
  if (!/\.glb$/i.test(entry.model || "")) errors.push("model-must-be-glb");
  if (!Array.isArray(entry.lods) || entry.lods.length !== 2) errors.push("two-lods-required");
  if (!entry.rig) errors.push("rig-required");
  if (entry.referenceStatus !== "approved") errors.push("reference-not-approved");
  if (!entry.visualIdentity?.build) errors.push("body-build-required");
  if (!entry.visualIdentity?.face) errors.push("face-identity-required");
  if (requiredClipsForAssetV1(entry).length < 7) errors.push("animation-contract-incomplete");

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

if (typeof window !== "undefined") {
  window.__footballLabCharacterEngineV1 = Object.freeze({
    build: CHARACTER_PRODUCTION_BUILD_V1,
    target: CHARACTER_PRODUCTION_CONTRACT_V1.rendererTarget,
    fallbackRenderer: CHARACTER_PRODUCTION_CONTRACT_V1.fallbackRenderer,
    get snapshot() { return characterEngineSnapshotV1(); },
    get readiness() { return productionReadinessV1(); }
  });
}
