const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveRecipients(inputEmails, isSuccess) {
  const mandatoryFailureRecipients = ['contact.szaman@gmail.com', 'management@realey.au'];
  const defaultRecipients = ['contact.szaman@gmail.com', 'management@realey.au'];

  let list = [];
  if (inputEmails && inputEmails.trim()) {
    list = inputEmails.split(',').map(e => e.trim()).filter(Boolean);
  } else {
    list = [...defaultRecipients];
  }

  if (!isSuccess) {
    list = list.concat(mandatoryFailureRecipients);
  }

  const seen = new Set();
  const deduped = [];
  for (const email of list) {
    const lower = email.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(email);
    }
  }

  return deduped.join(', ');
}

function parseFailures(jsonReportPath) {
  const failures = [];
  if (!fs.existsSync(jsonReportPath)) {
    return failures;
  }

  try {
    const raw = fs.readFileSync(jsonReportPath, 'utf8');
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      data.forEach(feature => {
        if (!feature.elements) return;
        feature.elements.forEach(scenario => {
          if (!scenario.steps) return;
          scenario.steps.forEach(step => {
            if (step.result && step.result.status === 'failed') {
              const fullError = step.result.error_message || 'Step failed without explicit error message.';
              const firstDecisiveLines = fullError
                .split('\n')
                .slice(0, 6)
                .join('\n')
                .trim();

              failures.push({
                feature: feature.name || 'Unnamed Feature',
                scenario: scenario.name || 'Unnamed Scenario',
                step: `${step.keyword || ''}${step.name || ''}`.trim(),
                error: firstDecisiveLines
              });
            }
          });
        });
      });
    }
  } catch (err) {
    console.error('Error parsing cucumber json report:', err.message);
  }

  return failures;
}

function generateEmailHtml({
  outcome,
  allureUrl,
  runUrl,
  runId,
  repo,
  trigger,
  date,
  jsonReportPath
}) {
  const isPassed = outcome === 'success';
  const statusText = isPassed ? 'PASSED' : 'FAILED';
  const statusColor = isPassed ? '#16a34a' : '#dc2626';
  const statusBg = isPassed ? '#f0fdf4' : '#fef2f2';
  const statusBorder = isPassed ? '#86efac' : '#fca5a5';

  const failures = isPassed ? [] : parseFailures(jsonReportPath);

  let failureSummaryHtml = '';
  if (!isPassed) {
    if (failures.length > 0) {
      const failureItems = failures.map((f, i) => `
        <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <div style="font-weight: 700; color: #b91c1c; font-size: 13.5px; margin-bottom: 4px;">
            Failure #${i + 1}: ${escapeHtml(f.feature)}
          </div>
          <div style="font-size: 12.5px; color: #374151; margin-bottom: 4px;">
            <strong>Scenario:</strong> ${escapeHtml(f.scenario)}
          </div>
          <div style="font-size: 12.5px; color: #374151; margin-bottom: 6px;">
            <strong>Failed Step:</strong> <code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: Consolas, monospace; color: #b91c1c;">${escapeHtml(f.step)}</code>
          </div>
          <div style="font-size: 12px; color: #7f1d1d; background-color: #fef2f2; padding: 8px 10px; border-radius: 4px; border-left: 3px solid #ef4444; font-family: Consolas, monospace; white-space: pre-wrap; word-break: break-word;">${escapeHtml(f.error)}</div>
        </div>
      `).join('');

      failureSummaryHtml = `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #991b1b;">
            ⚠️ Root Cause &amp; Failure Summary (${failures.length} failed ${failures.length === 1 ? 'step' : 'steps'})
          </h3>
          ${failureItems}
        </div>
      `;
    } else {
      failureSummaryHtml = `
        <div style="margin-bottom: 24px; padding: 14px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #991b1b;">
          <strong>⚠️ Suite Execution Failed:</strong> Check GitHub Action run log or system timeout.
        </div>
      `;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #ffffff; padding: 28px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 28px; }
    .status-banner { padding: 16px 20px; border-radius: 8px; font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 24px; border: 1px solid; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
    .details-table td.value { color: #0f172a; }
    .flow-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .flow-list ol { margin: 0; padding-left: 20px; }
    .btn-container { text-align: center; margin: 28px 0 12px 0; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 6px; }
    .btn-primary { background-color: #2563eb; color: #ffffff !important; }
    .btn-secondary { background-color: #f1f5f9; color: #334155 !important; border: 1px solid #cbd5e1; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Realey Daily 9AM E2E Automation</h1>
      <p>Scheduled Full Suite Execution (Flows 1 to 9)</p>
    </div>
    <div class="content">
      <div class="status-banner" style="background-color: ${statusBg}; color: ${statusColor}; border-color: ${statusBorder};">
        Suite Status: ${statusText}
      </div>

      ${failureSummaryHtml}

      <table class="details-table">
        <tr><td class="label">Repository</td><td class="value">${escapeHtml(repo)}</td></tr>
        <tr><td class="label">Trigger</td><td class="value">${escapeHtml(trigger)}</td></tr>
        <tr><td class="label">Executed At</td><td class="value">${escapeHtml(date)}</td></tr>
        <tr><td class="label">GitHub Run</td><td class="value"><a href="${escapeHtml(runUrl)}" style="color: #2563eb;">#${escapeHtml(runId)}</a></td></tr>
        <tr><td class="label">Allure Report</td><td class="value"><a href="${escapeHtml(allureUrl)}" style="color: #2563eb; font-weight: 600;">View Full Allure Report &rarr;</a></td></tr>
      </table>

      <div class="flow-list">
        <strong>Suite Scope (Flows 1 – 9):</strong>
        <ol>
          <li>Flow 1 — Fixed Price Direct Offer Acceptance &amp; Settlement</li>
          <li>Flow 2 — Offer Counter-Offer Negotiation &amp; Deposit Payment</li>
          <li>Flow 3 — Auction Two-Bidder War &amp; Settlement</li>
          <li>Flow 4 — Auction Reserve Not Met Counter Negotiation</li>
          <li>Flow 5 — Auction Counter Rejected &amp; Relisted as Fixed Price</li>
          <li>Flow 6 — Settlement Document Exchange &amp; Mouse Signature Drawing</li>
          <li>Flow 7 — Sales Instructions Delivery &amp; Timing</li>
          <li>Flow 8 — Progress Task List Verification in Chatroom</li>
          <li>Flow 9 — Passed-In Auction Negotiation Declined</li>
        </ol>
      </div>

      <div class="btn-container">
        <a href="${escapeHtml(allureUrl)}" class="btn btn-primary">Open Allure Report</a>
        <a href="${escapeHtml(runUrl)}" class="btn btn-secondary">View GitHub Action Run</a>
      </div>
    </div>
    <div class="footer">
      Automated notification generated by Realey Automation CI/CD &bull; Daily 9:00 AM Run
    </div>
  </div>
</body>
</html>`;
}

// Execution
const outcome = process.env.TEST_OUTCOME || 'success';
const isSuccess = outcome === 'success';
const allureUrl = process.env.ALLURE_URL || 'https://c4u-tech-ltd.github.io/realey-automation/#behaviors';
const runUrl = process.env.RUN_URL || 'https://github.com/C4U-TECH-LTD/realey-automation/actions';
const runId = process.env.RUN_ID || '1';
const repo = process.env.REPO || 'C4U-TECH-LTD/realey-automation';
const trigger = process.env.TRIGGER || 'schedule';
const date = process.env.DATE || new Date().toUTCString();
const jsonReportPath = path.resolve(process.env.JSON_REPORT_PATH || 'reports/cucumber/cucumber-report.json');
const outputFile = path.resolve(process.env.OUTPUT_FILE || 'email-body.html');
const inputEmails = process.env.INPUT_RECIPIENT_EMAILS || '';

const finalRecipients = resolveRecipients(inputEmails, isSuccess);
console.log('Final resolved recipients:', finalRecipients);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `recipients=${finalRecipients}\n`);
}

const html = generateEmailHtml({
  outcome,
  allureUrl,
  runUrl,
  runId,
  repo,
  trigger,
  date,
  jsonReportPath
});

fs.writeFileSync(outputFile, html, 'utf8');
console.log('Generated email body at:', outputFile);
