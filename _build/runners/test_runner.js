// Copyright Titanium I.T. LLC.
import * as colors from "../util/colors.js";
import { TestRunner } from "../util/tests/test_runner.js";

const failColor = colors.red;
const timeoutColor = colors.purple;
const skipColor = colors.cyan;
const passColor = colors.green;
const summaryColor = colors.brightWhite.dim;

export async function runAsync(header, testFiles) {
  if (testFiles.length === 0) return;

  process.stdout.write(`${header}: `);
  const startTime = Date.now();
  const testSummary = await TestRunner.create().testFilesAsync(testFiles);
  if (testSummary.total === 0) {
    process.stdout.write("\n");
    throw new Error("No tests found");
  }
  renderSummary(startTime, testSummary);

  return {
    failed: !testSummary.success,
    passFiles: testSummary.successFiles,
  };
}

function renderSummary(startTime, summary) {
  const elapsedMs = Date.now() - startTime;
  const elapsedSec = (elapsedMs / 1000).toFixed(2);
  const msEach = (elapsedMs / (summary.total - summary.skip)).toFixed(1);
  const render =
    summaryColor(`\n(`) +
    renderCount(summary.fail, "failed", failColor) +
    renderCount(summary.timeout, "timed out", timeoutColor) +
    renderCount(summary.skip, "skipped", skipColor) +
    renderCount(summary.pass, "passed", passColor) +
    summaryColor(`${msEach}ms avg., ${elapsedSec}s ttl.)\n`);
  process.stdout.write(render);
}

function renderCount(number, description, color) {
  if (number === 0) {
    return "";
  } else {
    return color(`${number} ${description}; `);
  }
}
