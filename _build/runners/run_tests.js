// Copyright Titanium I.T. LLC.
import * as colors from "../util/colors.js";
import { TestRunner } from "../util/tests/test_runner.js";
import path from "node:path";

const failColor = colors.red;
const timeoutColor = colors.purple;
const skipColor = colors.cyan;
const passColor = colors.green;
const summaryColor = colors.white;

const [ header, ...files ] = process.argv.slice(2);
const result = await runAsync({ header, files });
process.send(result);

export async function runAsync({ header = "Testing", files = [] }) {
  if (files.length === 0) return {
    failed: false,
    passFiles: [],
  };

  process.stdout.write(`${header}: `);
  const startTime = Date.now();
  const testSummary = await TestRunner.create().testFilesAsync(files);
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
  const elapsedRender = `${(elapsedMs / 1000).toFixed(2)}s`;
  const msEach = (elapsedMs / (summary.total - summary.skip)).toFixed(1);

  const countRender =
    renderCount(summary.fail, "failed", failColor) +
    renderCount(summary.timeout, "timed out", timeoutColor) +
    renderCount(summary.skip, "skipped", skipColor) +
    renderCount(summary.pass, "passed", passColor) +
    summaryColor(`${msEach}ms avg.`);

  const fullRender = summary.success
    ? summaryColor(` (${elapsedRender})\n(`) + countRender + summaryColor(")\n")
    : summaryColor(`\n(`) + countRender + summaryColor(`; ${elapsedRender} ttl.)\n`);

  process.stdout.write(fullRender);
}

function renderCount(number, description, color) {
  if (number === 0) {
    return "";
  } else {
    return color(`${number} ${description}; `);
  }
}
