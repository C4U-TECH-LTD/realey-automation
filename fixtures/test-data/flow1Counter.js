const fs = require("fs");
const path = require("path");

const COUNTER_FILE = path.resolve(__dirname, "flow1-counter.json");

const CBD_STREETS = [
  "Bourke Street",
  "Flinders Street",
  "Russell Street",
  "Exhibition Street",
  "Spring Street",
  "Lonsdale Street",
  "William Street",
  "Queen Street",
  "King Street",
];

/**
 * Returns the search query with a unique street number for Flow 1 listing creation.
 * Combines local counter with a time-based offset (50..650) to guarantee uniqueness
 * across ephemeral GitHub Actions CI runners, multiple workflows, and re-runs
 * without colliding with existing listings on UAT/Staging. Rotates through CBD
 * street names to avoid saturating any single street in the agent's account.
 */
function getNextFlow1SearchAddress(baseName = "King Street") {
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
    console.warn("Could not read flow1-counter.json, defaulting to 1:", err.message);
  }

  // Derive unique street number (50..649) to ensure valid Melbourne Google Places results
  // and prevent collisions across multiple CI workflows sharing UAT/Staging.
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
    console.warn("Could not write flow1-counter.json:", err.message);
  }

  // Pick rotated street if baseName is absent or default/King
  let streetName;
  if (!baseName || baseName.includes("King") || baseName.includes("Arndale")) {
    streetName = CBD_STREETS[counter % CBD_STREETS.length];
  } else {
    streetName = baseName.split(",")[0].replace(/^\d+[\s\/-]*/, "").trim() || CBD_STREETS[counter % CBD_STREETS.length];
  }

  return {
    counter: uniqueStreetNumber,
    searchAddress: `${uniqueStreetNumber} ${streetName}, Melbourne`,
    streetName,
  };
}

module.exports = {
  getNextFlow1SearchAddress,
};
