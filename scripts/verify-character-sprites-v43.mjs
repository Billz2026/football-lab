import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_LENGTH = 100124;
const EXPECTED_BASE64_SHA256 = "8bbe50ce518207b849f446846769e4b4bda776c390644f42df3dc48bd43be6b3";
const EXPECTED_BINARY_SHA256 = "aa303f210e523a01aa78ce586ccb69857a3b3972d77fb173a067ca3e5772308e";
const PART_NAMES = [
  "masters-v43.part0.b64",
  "masters-v43.part1.b64",
  "masters-v43.part2a.b64",
  "masters-v43.part2m.b64",
  "masters-v43.part2b.b64",
  "masters-v43.part3.b64",
  "masters-v43.part4.b64",
  "masters-v43.part5.b64",
  "masters-v43.part6.b64",
  "masters-v43.part7.b64"
];

const parts = [];
for (const name of PART_NAMES) {
  const file = path.join(ROOT, "game", "assets", "characters", "v43", name);
  parts.push((await readFile(file, "utf8")).trim());
}
const base64 = parts.join("");
const base64Hash = createHash("sha256").update(base64).digest("hex");
if (base64.length !== EXPECTED_LENGTH) throw new Error(`V43.2 atlas base64 length ${base64.length} != ${EXPECTED_LENGTH}`);
if (base64Hash !== EXPECTED_BASE64_SHA256) throw new Error(`V43.2 atlas base64 hash mismatch: ${base64Hash}`);

const binary = Buffer.from(base64, "base64");
const binaryHash = createHash("sha256").update(binary).digest("hex");
if (binaryHash !== EXPECTED_BINARY_SHA256) throw new Error(`V43.2 atlas binary hash mismatch: ${binaryHash}`);
if (binary.subarray(0, 4).toString("ascii") !== "RIFF" || binary.subarray(8, 12).toString("ascii") !== "WEBP") {
  throw new Error("V43.2 atlas is not a valid WebP RIFF payload");
}
console.log(`V43.2 high-resolution character atlas verified: ${binary.length} bytes, ${PART_NAMES.length} payload parts.`);
