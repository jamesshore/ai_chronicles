// Copyright Titanium I.T. LLC.
import * as colors from "../util/colors.js";
import { TestRunner } from "../util/tests/test_runner.js";
import sourceMapSupport from "source-map-support";
import { readFileAsync } from "../util/build_lib.js";

/* source-map-support issue: it causes massive performance degradation. JDLS 16 May 2023
 *
 * Source-map-support hooks into the V8 engine to apply source maps to stack traces.
 * But it causes noticeable pauses during the test run. As of this commit, with source-
 * map-support disabled, running `./build.sh clean test` takes 0.43s to run 265 tests.
 * With it enabled, it takes 1.35s (!!!) with two very noticeable pauses in the middle.
 * It also caused a ~0.60s delay when displaying a test failure in _hello.test.tsx,
 * presumably due to translating the stack trace displayed in the failure message.
 *
 * I'm not sure why source-map-support's performance is so bad. Possibly due to it needing
 * to synchronously read files looking for source maps whenever an exception is thrown?
 * The problems should go away if we manually translate stack traces only when failures
 * occur. We can use Mozilla's source-map library to do that.
 */
sourceMapSupport.install();   // automatically apply source maps to stack traces

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
  const originalFilesToTestFilesMap = await mapFilesToOriginals(files);

  const testSummary = await TestRunner.create().testFilesAsync(files, Object.keys(originalFilesToTestFilesMap));
  if (testSummary.total === 0) {
    process.stdout.write("\n");
    throw new Error("No tests found");
  }

  renderSummary(startTime, testSummary);

  return {
    failed: !testSummary.success,
    passFiles: testSummary.successFiles.map(file => originalFilesToTestFilesMap[file]),
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

async function mapFilesToOriginals(files) {
  const entries = await Promise.all(files.map(async (file) => {
    const sourceMapFilename = `${file}.map`;
    let sourceMap;
    try {
      sourceMap = JSON.parse(await readFileAsync(sourceMapFilename));
    } catch (err) {
      return [ file, file ];
    }
    const sourcesLength = sourceMap.sources?.length;
    if (sourcesLength !== 1) {
      throw new Error(`Source map '${sourceMapFilename}:1' should have one 'sources' entry, but it was ${sourcesLength}`);
    }

    return [ sourceMap.sources[0], file ];
  }));

  return Object.fromEntries(entries);
}
