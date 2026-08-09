const fs = require("fs");

fs.mkdirSync(
  "reports/cucumber",
  {
    recursive: true,
  }
);

fs.mkdirSync(
  "allure-results",
  {
    recursive: true,
  }
);

module.exports = {
  default: {
    // =================================================
    // FEATURES
    // =================================================

    paths: [
      "features/**/*.feature",
    ],

    // =================================================
    // SUPPORT + STEPS
    // =================================================

    require: [
      "features/support/**/*.js",
      "features/step-definitions/**/*.js",
    ],

    // =================================================
    // REPORTERS
    // =================================================

    format: [
      "progress",

      "html:reports/cucumber/cucumber-report.html",

      "json:reports/cucumber/cucumber-report.json",

      "allure-cucumberjs/reporter",
    ],

    // =================================================
    // FORMAT OPTIONS
    // =================================================

    formatOptions: {
      snippetInterface:
        "async-await",

      resultsDir:
        "allure-results",
    },

    // =================================================
    // EXECUTION
    // =================================================

    parallel: 1,

    /*
     * Keep retries off for your
     * interactive/self-hosted run unless
     * you explicitly enable CI.
     */
    retry:
      process.env.CI === "true"
        ? 1
        : 0,

    publishQuiet:
      true,
  },
};