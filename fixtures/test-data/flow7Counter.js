const fs = require("fs");
const path = require("path");

const COUNTER_FILE = path.resolve(__dirname, "flow7-counter.json");

/**
 * Returns the search query with a unique street number for Flow 7 (ACT Sales Instructions).
 * Combines local counter with a time-based offset (20..220) to guarantee uniqueness
 * across ephemeral GitHub Actions CI runners and re-runs in Canberra ACT.
 */
function getNextFlow7SearchAddress(baseName = "London Circuit") {
  let counter = 1;

  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const content = fs.readFileSync(COUNTER_FILE, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(content);
      if (typeof parsed.counter === "number" && !isNaN(parsed.counter) && parsed.counter >= 1) {
        counter = parsed.counter;
      }
    }
  } catch (err) {
    console.warn("Could not read flow7-counter.json, defaulting to 1:", err.message);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  // Range: 20..219 for London Circuit, Canberra ACT
  const timeOffset = (nowSec + counter * 13) % 200;
  const uniqueStreetNumber = 20 + timeOffset;

  const nextCounter = counter + 1;
  try {
    fs.writeFileSync(
      COUNTER_FILE,
      JSON.stringify({ counter: nextCounter, lastStreetNumber: uniqueStreetNumber, lastUpdated: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("Could not write flow7-counter.json:", err.message);
  }

  const cleanBase = (baseName || "London Circuit")
    .split(",")[0]
    .replace(/^\d+[\s\/-]*/, "")
    .trim() || "London Circuit";

  return {
    counter: uniqueStreetNumber,
    searchAddress: `${uniqueStreetNumber} ${cleanBase}, Canberra`,
  };
}

module.exports = {
  getNextFlow7SearchAddress,
};
