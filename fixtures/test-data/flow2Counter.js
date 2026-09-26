const fs = require("fs");
const path = require("path");

const COUNTER_FILE = path.resolve(__dirname, "flow2-counter.json");

/**
 * Returns the search query with an incrementing number for Flow 2 listing creation.
 * Persists the counter so every subsequent run increments:
 * Run 1: "Bourke Street 1" -> next becomes 2
 * Run 2: "Bourke Street 2" -> next becomes 3
 * Run 3: "Bourke Street 3" -> next becomes 4
 *
 * In CI (GitHub Actions), if GITHUB_RUN_NUMBER is present, incorporates it
 * so runs across fresh checkouts never repeat the same address.
 */
function getNextFlow2SearchAddress(baseName = "Bourke Street") {
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
    console.warn("Could not read flow2-counter.json, defaulting to 1:", err.message);
  }

  // In GitHub Actions, offset counter by GITHUB_RUN_NUMBER to guarantee uniqueness across CI checkouts
  if (process.env.GITHUB_RUN_NUMBER) {
    const ciRun = parseInt(process.env.GITHUB_RUN_NUMBER, 10);
    if (!isNaN(ciRun) && ciRun > 0) {
      counter = Math.max(counter, ciRun);
    }
  }

  const currentCounter = counter;
  const nextCounter = currentCounter + 1;

  try {
    fs.writeFileSync(
      COUNTER_FILE,
      JSON.stringify({ counter: nextCounter, lastUpdated: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("Could not write flow2-counter.json:", err.message);
  }

  return {
    counter: currentCounter,
    searchAddress: `${baseName} ${currentCounter}`,
  };
}

module.exports = {
  getNextFlow2SearchAddress,
};
