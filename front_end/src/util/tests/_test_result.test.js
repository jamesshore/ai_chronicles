// Copyright Titanium I.T. LLC.
import { test, assert } from "../tests.js";
import { TestResult } from "./test_result.js";
import * as util from "node:util";
import * as colors from "./colors.js";

export default test(({ describe }) => {

	describe("test suite", ({ it }) => {

		it("has a name and list of test results", () => {
			const list = [ createPass("test 1"), createPass("test 2") ];
			const result = TestResult.suite("my name", list);

			assert.deepEqual(result.name, [ "my name" ], "name");
		});

		it("has a filename based on parent", () => {
			const grandchild = createPass();
			const child = createSuite({ name: "child", results: [ grandchild ] });
			const parent = createSuite({ name: "parent", results: [ child ] });
			parent.filename = "/my/filename";

			assert.equal(parent.filename, "/my/filename");
			assert.equal(child.filename, "/my/filename");
			assert.equal(grandchild.filename, "/my/filename");
		});

		it("name includes parent suite", () => {
			const grandchild = createSuite({ name: "grandchild" });
			const child = createSuite({ name: "child", results: [ grandchild ]});
			createSuite({ name: "parent", results: [ child ]});

			assert.deepEqual(grandchild.name, [ "parent", "child", "grandchild" ]);
		});

		it("name includes base filename when it exists", function() {
			const child = createSuite({ name: "child" });
			const parent = createSuite({ name: "parent", results: [ child ] });
			parent.filename = "/my/long/filename";

			assert.deepEqual(child.name, [ "filename", "parent", "child" ]);
		});

		it("name doesn't include parent when parent name is empty", () => {
			const grandchild = createSuite({ name: "grandchild" });
			const child = createSuite({ name: "child", results: [ grandchild ]});
			createSuite({ name: "", results: [ child ]});

			assert.deepEqual(grandchild.name, [ "child", "grandchild" ]);
		});

		it("can be compared using equals()", () => {
			assert.objEqual(TestResult.suite("my name", []), TestResult.suite("my name", []));
			assert.objNotEqual(TestResult.suite("my name", []), TestResult.suite("different", []));

			assert.objEqual(
				TestResult.suite("my name", [ TestResult.pass("test name") ]),
				TestResult.suite("my name", [ TestResult.pass("test name") ]),
			);
			assert.objNotEqual(
				TestResult.suite("my name", [ TestResult.pass("test name") ]),
				TestResult.suite("my name", [ TestResult.pass("different") ]),
			);
		});

		it("is successful if all of its test results are successful", () => {
			assert.equal(
				createSuite({ results: [ createPass(), createPass() ]}).isSuccess(),
				true,
				"all pass"
			);

			assert.equal(
				createSuite({ results: [ createPass(), createFail() ]}).isSuccess(),
				false,
				"one fail"
			);
		});

		it("flattens failures and timeouts into a single list", () => {
			const suite = createSuite({ results: [
				createPass(),
				createSkip(),
				createFail({ name: "fail 1" }),
				createSuite({ results: [
					createTimeout({ name: "timeout" }),
					createFail({ name: "fail 2" }),
				]}),
			]});

			const failures = suite.allFailures();
			assert.equal(failures.length, 3);
			assert.objEqual(failures[0], createFail({ name: "fail 1" }));
			assert.objEqual(failures[1], createTimeout({ name: "timeout" }));
			assert.objEqual(failures[2], createFail({ name: "fail 2" }));
		});


		describe("summary", ({ it }) => {

			it("provides test count", () => {
				const suite = createSuite({ results: [
					createPass(),
					createFail(),
					createFail(),
					createSkip(),
					createSkip(),
					createSkip(),
					createTimeout(),
					createTimeout(),
					createTimeout(),
					createTimeout(),
				]});

				assert.deepEqual(suite.summary(), {
					[TestResult.PASS]: 1,
					[TestResult.FAIL]: 2,
					[TestResult.SKIP]: 3,
					[TestResult.TIMEOUT]: 4,
					total: 10,
					success: false,
					successFiles: [],
				});
			});

			it("counts tests in sub-suites", () => {
				const suite = createSuite({ results: [
					createPass(),
					createFail(),
					createSuite({ results: [
						createFail(),
						createFail(),
						createSkip(),
					]}),
				]});

				assert.deepEqual(suite.summary(), {
					[TestResult.PASS]: 1,
					[TestResult.FAIL]: 3,
					[TestResult.SKIP]: 1,
					[TestResult.TIMEOUT]: 0,
					total: 5,
					success: false,
					successFiles: [],
				});
			});

			it("is successful if all tests successful", () => {
				const suite = createSuite({ results: [
					createPass(),
					createSuite({ results: [
						createSkip(),
					]}),
				]});
				assert.equal(suite.summary().success, true);
			});

			it("includes filenames of passing suites", () => {
				const suite = createSuite({ results: [
					createSuite({ filename: "file1", results: [
						createSkip(),
					]}),
					createSuite({ filename: "file2", results: [
						createPass(),
					]}),
				]});
				assert.deepEqual(suite.summary().successFiles, [ "file2" ]);
			});

			it("does not include filenames more than once", () => {
				const suite = createSuite({ results: [
						createSuite({ filename: "my_file", results: [
								createSuite({ results: [
										createPass(),
									]}),
							]}),
					]});
				assert.deepEqual(suite.summary().successFiles, [ "my_file" ]);
			});

		});

	});


	describe("test case", ({ it }) => {

		it("passing tests have a name and status", () => {
			const result = TestResult.pass("my name");

			assert.deepEqual(result.name, [ "my name" ], "name");
			assert.equal(result.status, TestResult.PASS, "status");
			assert.isUndefined(result.error, "error");
			assert.isUndefined(result.timeout, "timeout");
		});

		it("name includes parent suite", () => {
			const test = createPass({ name: "test" });
			createSuite({ name: "suite", results: [ test ]});
			assert.deepEqual(test.name, [ "suite", "test" ]);
		});

		it("has filename based on parent suite", () => {
			const test = createPass();
			assert.isUndefined(test.filename, "without parent suite");

			createSuite({ filename: "my_filename", results: [ test ]});
			assert.equal(test.filename, "my_filename", "with parent suite");
		});

		it("failing tests have a name, status, and error", () => {
			const result = TestResult.fail("my name", new Error("my error"));

			assert.deepEqual(result.name, [ "my name" ], "name");
			assert.equal(result.status, TestResult.FAIL, "status");
			assert.equal(result.error.message, "my error", "error");
			assert.isUndefined(result.timeout, "timeout");
		});

		it("failing tests can have a string for the error", () => {
			const result = TestResult.fail("irrelevant name", "my error");
			assert.equal(result.error, "my error");
		});

		it("skipped tests have a name and status", () => {
			const result = TestResult.skip("my name");

			assert.deepEqual(result.name, [ "my name" ], "name");
			assert.equal(result.status, TestResult.SKIP, "status");
			assert.isUndefined(result.error, "error");
			assert.isUndefined(result.timeout, "timeout");
		});

		it("timeout tests have name, status, and timeout", () => {
			const result = TestResult.timeout("my name", 999);

			assert.deepEqual(result.name, [ "my name" ], "name");
			assert.equal(result.status, TestResult.TIMEOUT, "status");
			assert.isUndefined(result.error, "error");
			assert.equal(result.timeout, 999);
		});

		it("can be compared using equals()", () => {
			assert.objEqual(TestResult.pass("my name"), TestResult.pass("my name"));
			assert.objEqual(
				TestResult.fail("my name", new Error("my error")),
				TestResult.fail("my name", new Error("my error")),  // if name is same, error is same
			);

			assert.objNotEqual(TestResult.pass("my name"), TestResult.pass("different"));
			assert.objNotEqual(TestResult.pass("my name"), TestResult.skip("my name"));
			assert.objNotEqual(TestResult.pass("my name"), TestResult.fail("my name", new Error()));
			assert.objNotEqual(
				TestResult.timeout("my name", 1),
				TestResult.timeout("my name", 2),
			);
		});

		it("considers 'pass' and 'skipped' to be successes, and 'fail' and 'timeout' to be failures", () => {
			assert.equal(createPass().isSuccess(), true, "pass");
			assert.equal(createFail().isSuccess(), false, "fail");
			assert.equal(createSkip().isSuccess(), true, "skip");
			assert.equal(createTimeout().isSuccess(), false, "timeout");
		});

	});


	describe("progress rendering", ({ it }) => {

		it("renders progress marker", () => {
			assert.equal(createPass().renderProgress(), colors.white("."), "pass");
			assert.equal(createFail().renderProgress(), colors.brightRed.inverse("X"), "fail");
			assert.equal(createSkip().renderProgress(), colors.cyan.dim("_"), "skip");
			assert.equal(createTimeout().renderProgress(), colors.purple.inverse("!"), "timeout");
		});

	});


	describe("full rendering", ({ describe, it }) => {

		it("'pass' renders name", () => {
			const result = createPass({ name: "my name" });
			assert.equal(result.render(), colors.brightWhite.bold("my name\n"));
		});

		it("'skip' renders name", () => {
			const result = createSkip({ name: "my name" });
			assert.equal(result.render(), colors.brightWhite.bold("my name\n"));
		});

		it("'timeout' renders name and timeout", () => {
			const result = createTimeout({ name: "my name", timeout: 42 });
			assert.equal(
				result.render(),
				colors.brightWhite.bold("my name\n") + colors.purple("\nTimed out after 42ms\n"),
			);
		});

		it("renders multi-level names", () => {
			const test = createPass({ name: "test" });
			const child = createSuite({ name: "child", results: [ test ]});
			createSuite({ name: "parent", results: [ child ]});

			assert.deepEqual(test.render(), colors.brightWhite.bold("parent » child\n» test\n"));
		});


		describe("fail", ({ it }) => {

			it("renders name, stack trace, and error message", () => {
				const error = new Error("my error");
				error.stack = "my stack";

				const result = createFail({ name: "my name", error });
				assert.equal(result.render(),
					colors.brightWhite.bold("my name\n") +
					"\nmy stack\n" +
					colors.brightWhite("\nmy name »\n") +
					colors.brightRed("my error\n")
				);
			});

			it("doesn't render stack trace when it doesn't exist (presumably, because error is a string)", () => {
				const result = createFail({ name: "my name", error: "my error" });
				assert.equal(result.render(),
					colors.brightWhite.bold("my name\n") +
					colors.brightRed("\nmy error\n")
				);
			});

			it("highlights stack trace lines that include test file", () => {
				const error = new Error("my error");
				error.stack = "Error: my error\n" +
					"    at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/_test_result.test.js:306:11\n" +
					"    at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:222:10\n" +
					"    at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/infrastructure/clock.js:68:26\n" +
					"    at new Promise (<anonymous>)\n" +
					"    at Clock.timeoutAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/infrastructure/clock.js:56:16)\n" +
					"    at runOneTestFnAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:220:21)\n" +
					"    at runTestAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:187:27)\n" +
					"    at async TestCase._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:178:6)\n" +
					"    at async TestSuite._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:110:17)\n" +
					"    at async TestSuite._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:110:17)\n";

				const expectedStack = "Error: my error\n" +
					colors.brightWhite.bold("--> at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/_test_result.test.js:306:11") + "\n" +
					"    at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:222:10\n" +
					"    at file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/infrastructure/clock.js:68:26\n" +
					"    at new Promise (<anonymous>)\n" +
					"    at Clock.timeoutAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/infrastructure/clock.js:56:16)\n" +
					"    at runOneTestFnAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:220:21)\n" +
					"    at runTestAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:187:27)\n" +
					"    at async TestCase._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:178:6)\n" +
					"    at async TestSuite._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:110:17)\n" +
					"    at async TestSuite._recursiveRunAsync (file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/test_suite.ts:110:17)\n";

				const testCase = createFail({ error });
				const suite = createSuite({
					results: [ testCase ],
					filename: "file:///Users/jshore/Documents/Projects/ai_chronicles/_build/util/tests/_test_result.test.js",
				});

				assert.includes(testCase.render(), expectedStack);
			});

			it("renders expected and actual values (when they exist)", () => {
				const error = new Error("my error");
				error.stack = "my stack";
				error.expected = "my expected";
				error.actual = "my actual";

				const result = createFail({ name: "my name", error });
				assert.equal(result.render(),
					colors.brightWhite.bold("my name\n") +
					"\nmy stack\n" +
					colors.brightWhite("\nmy name »\n") +
					colors.brightRed("my error\n") +
					"\n" + colors.green("expected: ") + util.inspect("my expected") + "\n" +
					colors.brightRed("actual:   ") + util.inspect("my actual") + "\n"
				);
			});

			it("highlights differences between expected and actual values when they have more than one line", () => {
				// This test depends on util.inspect() behavior, which is not guaranteed to remain consistent across
				// Node versions, so it could break after a Node version upgrade.

				const error = new Error("my error");
				error.stack = "my stack";
				error.expected = "1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n";
				error.actual   = "1234567890\n1234567890\nXXXXXXXXXX\n1234567890\n1234567890\n1234567890\n1234567890\n";

				const result = createFail({ name: "my name", error });
				assert.deepEqual(result.render(),
					colors.brightWhite.bold("my name\n") +
					"\nmy stack\n" +
					colors.brightWhite("\nmy name »\n") +
					colors.brightRed("my error\n") +
					"\n" + colors.green("expected: ") + "'1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n'\n" +
					colors.brightRed("actual:   ") + "'1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					colors.brightYellow.bold("  'XXXXXXXXXX\\n' +") + "\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n' +\n" +
					"  '1234567890\\n'\n"
				);
			});

			it("highlights differences between expected and actual values when expected has one line", () => {
				// This test depends on util.inspect() behavior, which is not guaranteed to remain consistent across
				// Node versions, so it could break after a Node version upgrade.
				const oneLine = "1234567890123456789012345678901234567890\n";
				const twoLines = "1234567890123456789012345678901234567890\n1234567890123456789012345678901234567890\n";

				const error = new Error("my error");
				error.stack = "my stack";
				error.expected = oneLine;
				error.actual = twoLines;

				const result = createFail({ name: "my name", error });
				assert.deepEqual(result.render(),
					colors.brightWhite.bold("my name\n") +
					"\nmy stack\n" +
					colors.brightWhite("\nmy name »\n") +
					colors.brightRed("my error\n") +
					"\n" + colors.green("expected: ") + colors.brightYellow.bold("'1234567890123456789012345678901234567890\\n'") + "\n" +
					colors.brightRed("actual:   ") + colors.brightYellow.bold("'1234567890123456789012345678901234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890123456789012345678901234567890\\n'") + "\n"
				);
			});

			it("doesn't break when actual and expected have different numbers of lines", () => {
				// This test depends on util.inspect() behavior, which is not guaranteed to remain consistent across
				// Node versions, so it could break after a Node version upgrade.
				const sevenLines = "1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n";
				const twoLines = "1234567890123456789012345678901234567890\n1234567890123456789012345678901234567890\n";

				const error = new Error("my error");
				error.stack = "my stack";
				const result = createFail({ name: "my name", error });

				error.expected = sevenLines;
				error.actual = twoLines;
				assert.deepEqual(result.render(),
					colors.brightWhite.bold("my name\n") +
					"\nmy stack\n" +
					colors.brightWhite("\nmy name »\n") +
					colors.brightRed("my error\n") +
					"\n" + colors.green("expected: ") + colors.brightYellow.bold("'1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890\\n'") + "\n" +
					colors.brightRed("actual:   ") + colors.brightYellow.bold("'1234567890123456789012345678901234567890\\n' +") + "\n" +
					colors.brightYellow.bold("  '1234567890123456789012345678901234567890\\n'") + "\n"
				);
			});

		});

	});

});

function createSuite({
	name = "irrelevant name",
	results = [],
	filename = undefined,
} = {}) {
	return TestResult.suite(name, results, filename);
}

function createPass({
	name = "irrelevant name",
} = {}) {
	return TestResult.pass(name);
}

function createFail({
	name = "irrelevant name",
	error = new Error("irrelevant error"),
} = {}) {
	return TestResult.fail(name, error);
}

function createSkip({
	name = "irrelevant name",
} = {}) {
	return TestResult.skip(name);
}

function createTimeout({
	name = "irrelevant name",
	timeout = 42,
} = {}) {
	return TestResult.timeout(name, timeout);
}