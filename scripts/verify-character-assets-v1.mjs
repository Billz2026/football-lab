import { access, open, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  CHARACTER_ASSETS_V1,
  CHARACTER_PRODUCTION_CONTRACT_V1,
  CHARACTER_RIGS_V1,
  requiredClipsForAssetV1
} from "../game/character-production-v1.js";

const ROOT = process.cwd();
const GAME_DIR = path.join(ROOT, "game");
const errors = [];
const warnings = [];

function localPath(relativeUrl) {
  return path.join(GAME_DIR, String(relativeUrl).replace(/^\.\//, ""));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyGlb(filePath, label) {
  const info = await stat(filePath);
  if (!info.isFile()) {
    errors.push(`${label}: expected a file`);
    return;
  }
  if (info.size < 20) {
    errors.push(`${label}: GLB is too small to be valid`);
    return;
  }
  const handle = await open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    if (header.toString("ascii", 0, 4) !== "glTF") errors.push(`${label}: missing glTF magic header`);
    if (header.readUInt32LE(4) !== 2) errors.push(`${label}: expected glTF binary version 2`);
    const declaredLength = header.readUInt32LE(8);
    if (declaredLength !== info.size) errors.push(`${label}: declared GLB length ${declaredLength} does not match file size ${info.size}`);
  } finally {
    await handle.close();
  }
}

for (const [id, entry] of Object.entries(CHARACTER_ASSETS_V1)) {
  if (!entry.model.endsWith(".glb")) errors.push(`${id}: production model must use .glb`);
  if (!Array.isArray(entry.lods) || entry.lods.length !== 2) errors.push(`${id}: exactly two gameplay LOD paths are required`);
  if (!entry.visualIdentity?.face?.startsWith("original-")) errors.push(`${id}: face identity must be explicitly original`);
  if (entry.referenceStatus !== "approved") errors.push(`${id}: reference must be approved before production staging`);

  const rig = entry.kind === "goalkeeper" ? CHARACTER_RIGS_V1.goalkeeper : CHARACTER_RIGS_V1.outfield;
  if (entry.rig !== rig.id) errors.push(`${id}: incorrect rig ${entry.rig}`);
  const clips = requiredClipsForAssetV1(entry);
  if (clips.length !== rig.requiredClips.length) errors.push(`${id}: animation clip contract mismatch`);

  const modelPath = localPath(entry.model);
  const exists = await fileExists(modelPath);
  if (entry.bundledModel !== exists) {
    errors.push(`${id}: bundledModel=${entry.bundledModel} does not match filesystem availability (${exists})`);
  }
  if (entry.productionStatus === "ready") {
    if (!exists) {
      errors.push(`${id}: marked ready but ${entry.model} is missing`);
    } else {
      await verifyGlb(modelPath, id);
    }

    for (const [index, lodUrl] of entry.lods.entries()) {
      const lodPath = localPath(lodUrl);
      if (!(await fileExists(lodPath))) errors.push(`${id}: marked ready but LOD${index + 1} is missing (${lodUrl})`);
      else await verifyGlb(lodPath, `${id} LOD${index + 1}`);
    }
  } else if (exists) {
    warnings.push(`${id}: GLB exists but productionStatus is ${entry.productionStatus}; it will remain blocked from live integration`);
  }
}

if (CHARACTER_PRODUCTION_CONTRACT_V1.liveIntegration) {
  const notReady = Object.values(CHARACTER_ASSETS_V1).filter((entry) => entry.productionStatus !== "ready");
  if (notReady.length) errors.push(`liveIntegration is enabled while ${notReady.length} character assets are not ready`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`Character production contract verified: ${Object.keys(CHARACTER_ASSETS_V1).length} approved identities; live integration=${CHARACTER_PRODUCTION_CONTRACT_V1.liveIntegration}.`);
