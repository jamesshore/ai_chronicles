// Copyright Titanium I.T. LLC.
import { describe, it, assert } from "../tests.js";
import * as testSuite from "./test_suite.js";
import { TestRunner } from "./test_runner.js";
import { ConsoleOutput } from "../infrastructure/console_output.js";
import { TestResult } from "./test_result.js";
/* dependency: ./test_runner.test.success_helper.js */
/* dependency: ./test_runner.test.no_module_helper.js */
/* dependency: ./test_runner.test.bad_module_helper.js */

import PASS_MODULE from "./test_runner.test.success_helper.js";

const IRRELEVANT_NAME = "irrelevant name";
const PASS_PROGRESS = TestResult.pass("irrelevant name").renderProgress();

describe("Test Runner", () => {

	it("renders progress", async () => {
		const { runner, output } = createRunner();

		await runner.testModuleAsync(testSuite.suite([PASS_MODULE, PASS_MODULE]));
		assert.deepEqual(output, [ PASS_PROGRESS, PASS_PROGRESS ]);
	});

	it("requires files", async () => {
		const { runner, output } = createRunner();

		await runner.testFilesAsync([ "./test_runner.test.success_helper.js" ]);
		assert.deepEqual(output, [ PASS_PROGRESS ]);
	});

	it("returns test counts", async () => {
		const { runner } = createRunner();

		assert.deepEqual(
			await runner.testFilesAsync([ "./test_runner.test.success_helper.js" ]),
			(await PASS_MODULE.runAsync()).summary(),
		);
	});

	it("outputs failure report", async () => {
		const { runner, output } = createRunner();

		const module = createModule(({ it }) => {
			it(IRRELEVANT_NAME, () => {
				throw new Error("my error");
			});
		});

		await runner.testModuleAsync(module);
		assert.match(output[1], /my error/);
	});

	it("fails gracefully if module fails to require()", async () => {
		const { runner, output } = createRunner();

		const counts = await runner.testFilesAsync([ "./test_runner.test.bad_module_helper.js" ]);
		assert.match(output[0], /error when requiring test_runner.test.bad_module_helper.js/);
		assert.match(output[0], /my require error/);
		assert.deepEqual(counts, await failureCountAsync());
	});

	it("fails gracefully if module isn’t a test suite", async () => {
		const { runner, output } = createRunner();

		const counts = await runner.testFilesAsync([ "./test_runner.test.no_module_helper.js" ]);
		assert.match(output[0], /doesn't export a test suite: \.\/test_runner.test.no_module_helper.js/);
		assert.deepEqual(counts, await failureCountAsync());
	});

});

function createModule(name, fn) {
	return testSuite.test(name, fn);
}

function createRunner() {
	const stdout = ConsoleOutput.createNull();
	const output = stdout.track().data;
	const runner = new TestRunner(stdout);

	return { runner, output };
}

async function failureCountAsync() {
	return (await testSuite.fail("irrelevant name", new Error("irrelevant error")).runAsync()).summary();
}