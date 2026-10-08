const fs = require("fs");
const path = require("path");

const resultsDir = path.resolve(process.cwd(), process.argv[2] || "allure-results");
const envLabel = process.argv[3] || "UAT";

if (!fs.existsSync(resultsDir)) {
  console.log(`Directory does not exist: ${resultsDir}`);
  process.exit(0);
}

const files = fs.readdirSync(resultsDir);
let count = 0;

for (const file of files) {
  if (!file.endsWith("-result.json")) continue;
  const filePath = path.join(resultsDir, file);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);

    // Prefix scenario name & fullName
    if (json.name && !json.name.startsWith(`[${envLabel}]`)) {
      json.name = `[${envLabel}] ${json.name}`;
    }
    if (json.fullName && !json.fullName.startsWith(`[${envLabel}]`)) {
      json.fullName = `[${envLabel}] ${json.fullName}`;
    }

    // Isolate historyId & testCaseId so Staging Flow 1 does not collide with UAT Flow 1
    const prefix = envLabel.toLowerCase();
    if (json.historyId && !json.historyId.startsWith(`${prefix}-`)) {
      json.historyId = `${prefix}-${json.historyId}`;
    }
    if (json.testCaseId && !json.testCaseId.startsWith(`${prefix}-`)) {
      json.testCaseId = `${prefix}-${json.testCaseId}`;
    }

    json.labels = json.labels || [];
    const existingParentSuite = json.labels.find((l) => l.name === "parentSuite");
    if (existingParentSuite) {
      existingParentSuite.value = `${envLabel} Environment`;
    } else {
      json.labels.push({ name: "parentSuite", value: `${envLabel} Environment` });
    }

    json.labels.push({ name: "tag", value: `@${prefix}` });
    json.labels.push({ name: "environment", value: envLabel });

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
    count++;
  } catch (err) {
    console.error(`Failed to process ${file}:`, err.message);
  }
}

console.log(`Tagged ${count} Allure result files with environment "${envLabel}".`);
