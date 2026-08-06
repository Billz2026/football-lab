const timeout = setTimeout(() => {
  console.error("V23 runtime capture exceeded the 90-second hard limit.");
  process.exit(1);
}, 90000);
timeout.unref?.();

try {
  await import("./capture-runtime-v23.mjs");
  clearTimeout(timeout);
  process.exit(0);
} catch (error) {
  clearTimeout(timeout);
  console.error(error?.stack || error);
  process.exit(1);
}
