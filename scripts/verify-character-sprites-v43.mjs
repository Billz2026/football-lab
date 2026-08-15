import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_LENGTH = 31480;
const EXPECTED_BASE64_SHA256 = "47b5d59247a235562f8d7a4dcf58a7e3fee6cba78231286c171f98aee272e255";
const EXPECTED_BINARY_SHA256 = "d475ea61ff859107d32db03a98140d165ef7fc5470fbaa876b736a345ba671ca";

const parts = [];
for (let index = 0; index < 8; index += 1) {
  const file = path.join(ROOT, "game", "assets", "characters", "v43", `masters-v43.part${index}.b64`);
  parts.push((await readFile(file, "utf8")).trim());
}
const base64 = parts.join("");
const base64Hash = createHash("sha256").update(base64).digest("hex");
if (base64.length !== EXPECTED_LENGTH) throw new Error(`V43 atlas base64 length ${base64.length} != ${EXPECTED_LENGTH}`);
if (base64Hash !== EXPECTED_BASE64_SHA256) throw new Error(`V43 atlas base64 hash mismatch: ${base64Hash}`);

const binary = Buffer.from(base64, "base64");
const binaryHash = createHash("sha256").update(binary).digest("hex");
if (binaryHash !== EXPECTED_BINARY_SHA256) throw new Error(`V43 atlas binary hash mismatch: ${binaryHash}`);
if (binary.subarray(0, 4).toString("ascii") !== "RIFF" || binary.subarray(8, 12).toString("ascii") !== "WEBP") {
  throw new Error("V43 atlas is not a valid WebP RIFF payload");
}
console.log(`V43 character atlas verified: ${binary.length} bytes, 8 payload parts.`);
