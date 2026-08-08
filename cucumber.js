const fs = require('fs');

fs.mkdirSync('reports/cucumber', { recursive: true });

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/**/*.js',
      'features/step-definitions/**/*.js',
    ],
    format: [
      'progress',
      'html:reports/cucumber/cucumber-report.html',
      'json:reports/cucumber/cucumber-report.json',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    parallel: 1,
    retry: process.env.CI ? 1 : 0,
    publishQuiet: true,
  },
};
