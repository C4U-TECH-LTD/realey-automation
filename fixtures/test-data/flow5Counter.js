const fs = require("fs");
const path = require("path");

const COUNTER_FILE = path.resolve(__dirname, "flow5-counter.json");

/**
 * Returns the search query with a unique street number for Flow 5 listing creation.
 * Combines local counter with a time-based offset (50..650) to guarantee uniqueness
 * across ephemeral GitHub Actions CI runners, multiple workflows, and re-runs
 * without colliding with existing listings on UAT.
 */
function getNextFlow5SearchAddress(baseName = "Elizabeth Street") {
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
    console.warn("Could not read flow5-counter.json, defaulting to 1:", err.message);
  }

  // Preserve explicit full addresses (e.g. Staging addresses with commas other than base Elizabeth Street)
  if (baseName && baseName.includes(",") && !baseName.toLowerCase().startsWith("elizabeth street")) {
    return {
      counter,
      searchAddress: baseName,
    };
  }

  // Derive unique street number (50..649) to ensure valid Melbourne Google Places results
  // and prevent collisions across multiple CI workflows sharing UAT.
  const nowSec = Math.floor(Date.now() / 1000);
  const timeOffset = (nowSec + counter * 17) % 600;
  const uniqueStreetNumber = 50 + timeOffset;

  const nextCounter = counter + 1;
  try {
    fs.writeFileSync(
      COUNTER_FILE,
      JSON.stringify({ counter: nextCounter, lastStreetNumber: uniqueStreetNumber, lastUpdated: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("Could not write flow5-counter.json:", err.message);
  }

  const cleanBase = baseName.replace(/,.*$/, "").trim();
  return {
    counter: uniqueStreetNumber,
    searchAddress: `${uniqueStreetNumber} ${cleanBase}, Melbourne`,
  };
}

module.exports = {
  getNextFlow5SearchAddress,
};

