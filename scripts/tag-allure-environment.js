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

    // Rename scenario name & fullName for Staging Flow 1
    const isStag = /stag/i.test(envLabel);
    if (json.name) {
      if (isStag) {
        json.name = json.name.replace(/^(\[.*?\]\s*)?Flow 1\b/i, "Stag Flow 1");
        if (!json.name.startsWith("Stag Flow 1") && !json.name.startsWith(`[${envLabel}]`)) {
          json.name = `[${envLabel}] ${json.name}`;
        }
      } else if (!json.name.startsWith(`[${envLabel}]`)) {
        json.name = `[${envLabel}] ${json.name}`;
      }
    }
    if (json.fullName) {
      if (isStag) {
        json.fullName = json.fullName.replace(/^(\[.*?\]\s*)?Flow 1\b/i, "Stag Flow 1");
      } else if (!json.fullName.startsWith(`[${envLabel}]`)) {
        json.fullName = `[${envLabel}] ${json.fullName}`;
      }
    }

    // Isolate historyId & testCaseId so Staging Flow 1 does not collide with UAT Flow 1
    const prefix = envLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (json.historyId && !json.historyId.startsWith(`${prefix}-`)) {
      json.historyId = `${prefix}-${json.historyId}`;
    }
    if (json.testCaseId && !json.testCaseId.startsWith(`${prefix}-`)) {
      json.testCaseId = `${prefix}-${json.testCaseId}`;
    }

    json.labels = json.labels || [];
    for (const label of json.labels) {
      if (isStag && (label.name === "feature" || label.name === "suite" || label.name === "subSuite")) {
        label.value = label.value.replace(/^Flow 1\b/i, "Stag Flow 1");
      }
    }

    const existingParentSuite = json.labels.find((l) => l.name === "parentSuite");
    const parentSuiteVal = isStag ? "Staging Environment" : `${envLabel} Environment`;
    if (existingParentSuite) {
      existingParentSuite.value = parentSuiteVal;
    } else {
      json.labels.push({ name: "parentSuite", value: parentSuiteVal });
    }

    json.labels.push({ name: "tag", value: `@${prefix}` });
    json.labels.push({ name: "environment", value: envLabel });

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
    count++;
  } catch (err) {
    console.error(`Failed to process ${file}:`, err.message);
  }
}

// Also rename inside Cucumber HTML & JSON reports if present
const isStag = /stag/i.test(envLabel);
if (isStag) {
  const cucumberJsonPath = path.resolve(process.cwd(), "reports/cucumber/cucumber-report.json");
  if (fs.existsSync(cucumberJsonPath)) {
    try {
      const raw = fs.readFileSync(cucumberJsonPath, "utf-8");
      const updated = raw.replace(/\bFlow 1 - /g, "Stag Flow 1 - ");
      fs.writeFileSync(cucumberJsonPath, updated, "utf-8");
      console.log(`Renamed Flow 1 to Stag Flow 1 in ${cucumberJsonPath}`);
    } catch (e) {
      console.warn("Could not update cucumber-report.json:", e.message);
    }
  }

  const cucumberHtmlPath = path.resolve(process.cwd(), "reports/cucumber/cucumber-report.html");
  if (fs.existsSync(cucumberHtmlPath)) {
    try {
      const raw = fs.readFileSync(cucumberHtmlPath, "utf-8");
      const updated = raw.replace(/\bFlow 1 - /g, "Stag Flow 1 - ");
      fs.writeFileSync(cucumberHtmlPath, updated, "utf-8");
      console.log(`Renamed Flow 1 to Stag Flow 1 in ${cucumberHtmlPath}`);
    } catch (e) {
      console.warn("Could not update cucumber-report.html:", e.message);
    }
  }
}

console.log(`Tagged ${count} Allure result files with environment "${envLabel}".`);
