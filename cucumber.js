const fs = require("fs");

fs.mkdirSync(
  "reports/cucumber",
  {
    recursive: true,
  }
);

module.exports = {
  default: {
    paths: [
      "features/**/*.feature",
    ],

    require: [
      "features/support/**/*.js",
      "features/step-definitions/**/*.js",
    ],

    format: [
      "progress",

      "html:reports/cucumber/cucumber-report.html",

      "json:reports/cucumber/cucumber-report.json",

      "allure-cucumberjs/reporter",
    ],

    formatOptions: {
      snippetInterface:
        "async-await",

      resultsDir:
        "allure-results",
    },

    parallel: 1,

    retry:
      process.env.CI
        ? 1
        : 0,

    publishQuiet: true,
  },
};