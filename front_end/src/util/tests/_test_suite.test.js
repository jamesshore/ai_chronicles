// Copyright Titanium I.T. LLC.
import { test, assert } from "../tests.js";
import * as testSuite from "./test_suite.js";
import { Clock } from "../../infrastructure/clock.js";
import { TestResult } from "./test_result.js";

// Tests for my test library. (How meta.)

const IRRELEVANT_NAME = "irrelevant name";
const DEFAULT_TIMEOUT = testSuite.DEFAULT_TIMEOUT_IN_MS;
const EXCEED_TIMEOUT = DEFAULT_TIMEOUT + 1;

export default test(({ describe }) => {

	describe("test suite", ({ it }) => {

		it("executes immediately (but tests don't)", () => {
			let suiteRan = false;
			let testRan = false;
			testSuite.test(({ it }) => {
				suiteRan = true;
				it(IRRELEVANT_NAME, () => {
					testRan = true;
				});
			});

			assert.equal(suiteRan, true, "should run suite");
			assert.equal(testRan, false, "should not run test");
		});

		it("returns test results when run", async () => {
			const suite = testSuite.test(({ it }) => {
				it("test 1", () => {});
				it("test 2", () => {});
				it("test 3", () => {});
			});

			const result = await suite.runAsync();
			assert.objEqual(result,
				TestResult.suite("", [
					TestResult.pass("test 1"),
					TestResult.pass("test 2"),
					TestResult.pass("test 3"),
				]),
			);
		});

		it("can be nested", async () => {
			const top = testSuite.test(({ describe }) => {
				describe("middle", ({ describe }) => {
					describe("bottom", ({ it }) => {
						it("my test", () => {});
					});
				});
			});

			const result = await top.runAsync();
			assert.objEqual(result,
				TestResult.suite("", [
					TestResult.suite("middle", [
						TestResult.suite("bottom", [
							TestResult.pass("my test"),
						]),
					]),
				]),
			);
		});

		it("can be created manually", async () => {
			const suite1 = testSuite.test(({ it }) => {
				it("test1", () => {});
			});
			const suite2 = testSuite.test(({ it }) => {
				it("test2", () => {});
			});

			const manualSuite = testSuite.suite([ suite1, suite2 ]);

			assert.objEqual(await manualSuite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("", [
						TestResult.pass("test1"),
					]),
					TestResult.suite("", [
						TestResult.pass("test2"),
					]),
				]),
			);
		});

		it("can create failure", async () => {
			const myError = new Error("my error");
			myError.stack = myError.stack = "my stack";

			const suite = testSuite.fail("my reason", myError);
			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.fail("my reason", myError),
				]),
			);
		});

		it("can have write-only filename, which is incorporated into test result", async () => {
			const suite = testSuite.test(({ it }) => {
				it("my test", () => {});
			});
			suite.filename = "/my/filename";

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.pass("my test"),
				], "/my/filename"),
			);
		});

	});


	describe("test case", ({ it }) => {

		it("runs when its parent suite is run", async () => {
			let testRan = false;
			const suite = testSuite.test(({ it }) => {
				it(IRRELEVANT_NAME, () => {
					testRan = true;
				});
			});

			assert.equal(testRan, false, "before suite runs");
			await suite.runAsync();
			assert.equal(testRan, true, "after suite runs");
		});

		it("works with asynchronous code", async () => {
			let testRan = false;
			const suite = testSuite.test(({ it }) => {
				it(IRRELEVANT_NAME, async () => {
					await new Promise((resolve) => {
						setImmediate(() => {
							testRan = true;
							resolve();
						});
					});
				});
			});

			await suite.runAsync();
			assert.equal(testRan, true);
		});

		it("passes when test doesn't throw exception", async () => {
			const result = await runTestAsync("my test", () => {});
			assert.objEqual(result, TestResult.pass("my test"));
		});

		it("fails when test throws exception", async () => {
			const error = new Error("my error");
			const result = await runTestAsync("my test", () => {
				throw error;
			});
			assert.objEqual(result, TestResult.fail("my test", error));
		});

		it("runs notify function", async () => {
			const suite = testSuite.test(({ it }) => {
				it("my test", () => {});
			});

			let testResult;
			function notifyFn(result) {
				testResult = result;
			}

			await suite.runAsync({ notifyFn });
			assert.objEqual(testResult, TestResult.pass("my test"));
		});

	});


	describe("before/after", ({ it }) => {

		it("runs function before and after all tests in a suite", async () => {
			const ordering = [];
			const pushFn = (message) => {
				return () => ordering.push(message);
			};

			const suite = testSuite.test(({ beforeAll, afterAll, describe, it }) => {
				beforeAll(pushFn("parent before 1"));
				beforeAll(pushFn("parent before 2"));
				afterAll(pushFn("parent after 1"));
				afterAll(pushFn("parent after 2"));
				it(IRRELEVANT_NAME, pushFn("test 1"));
				it(IRRELEVANT_NAME, pushFn("test 2"));
				describe(IRRELEVANT_NAME, ({ beforeAll, afterAll, it }) => {
					beforeAll(pushFn("child before"));
					afterAll(pushFn("child after"));
					it(IRRELEVANT_NAME, pushFn("test 3"));
				});
			});

			await suite.runAsync();
			assert.deepEqual(ordering, [
				"parent before 1",
				"parent before 2",
				"test 1",
				"test 2",
				"child before",
				"test 3",
				"child after",
				"parent after 1",
				"parent after 2",
			]);
		});

		it("doesn't run beforeAll and afterAll when all children are skipped", async () => {
			let beforeRan = false;
			let afterRan = false;
			const suite = testSuite.test(({ it, beforeAll, afterAll }) => {
				beforeAll(() => {
					beforeRan = true;
				});
				afterAll(() => {
					afterRan = true;
				});
				it.skip("test 1", async () => {});
				it.skip("test 2", async () => {});
			});

			await suite.runAsync();
			assert.equal(beforeRan, false, "shouldn't run beforeAll()");
			assert.equal(afterRan, false, "shouldn't run afterAll()");
		});

		it("runs function before and after each test in a suite", async () => {
			const ordering = [];
			const pushFn = (message) => {
				return () => ordering.push(message);
			};

			const suite = testSuite.test(({ beforeEach, afterEach, describe, it }) => {
				beforeEach(pushFn("parent before 1"));
				beforeEach(pushFn("parent before 2"));
				afterEach(pushFn("parent after 1"));
				afterEach(pushFn("parent after 2"));
				it(IRRELEVANT_NAME, pushFn("test 1"));
				it(IRRELEVANT_NAME, pushFn("test 2"));
				describe(IRRELEVANT_NAME, ({ beforeEach, afterEach, it }) => {
					beforeEach(pushFn("child before"));
					afterEach(pushFn("child after"));
					it(IRRELEVANT_NAME, pushFn("test 3"));
				});
			});

			await suite.runAsync();
			assert.deepEqual(ordering, [
				"parent before 1",
				"parent before 2",
				"test 1",
				"parent after 1",
				"parent after 2",
				"parent before 1",
				"parent before 2",
				"test 2",
				"parent after 1",
				"parent after 2",
				"parent before 1",
				"parent before 2",
				"child before",
				"test 3",
				"child after",
				"parent after 1",
				"parent after 2",
			]);
		});

		it("doesn't run beforeEach and afterEach when the test is skipped", async () => {
			let beforeRan = false;
			let afterRan = false;
			const suite = testSuite.test(({ it, beforeEach, afterEach }) => {
				beforeEach(() => {
					beforeRan = true;
				});
				afterEach(() => {
					afterRan = true;
				});
				it.skip("test 1", async () => {});
			});

			await suite.runAsync();
			assert.equal(beforeRan, false, "shouldn't run beforeEach()");
			assert.equal(afterRan, false, "shouldn't run afterEach()");
		});

		it("handles exception in beforeAll", async () => {
			const error = new Error("my error");
			const suite = testSuite.test(({ it, beforeAll }) => {
				beforeAll(() => {
					throw error;
				});
				it("test 1", async () => {});
				it("test 2", async () => {});
			});

			assert.objEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.fail("beforeAll()", error),
				]),
			);
		});

		it("handles exception in afterAll", async () => {
			const error = new Error("my error");
			const suite = testSuite.test(({ it, afterAll }) => {
				afterAll(() => {
					throw error;
				});
				it("test 1", async () => {});
				it("test 2", async () => {});
			});

			assert.objEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.pass("test 1"),
					TestResult.pass("test 2"),
					TestResult.fail("afterAll()", error),
				]),
			);
		});

		it("handles exception in beforeEach", async () => {
			const error = new Error("my error");
			const suite = testSuite.test(({ it, beforeEach }) => {
				beforeEach(() => {
					throw error;
				});
				it("test 1", async () => {});
				it("test 2", async () => {});
			});

			assert.objEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.fail("test 1", error),
					TestResult.fail("test 2", error),
				]),
			);
		});

		it("doesn't run test when beforeEach throws exception", async () => {
			let testRan = false;
			const suite = testSuite.test(({ it, beforeEach }) => {
				beforeEach(() => {
					throw new Error();
				});
				it("my test", () => {
					testRan = true;
				});
			});

			await suite.runAsync();
			assert.equal(testRan, false);
		});

		it("handles exception in afterEach", async () => {
			const error = new Error("my error");
			const suite = testSuite.test(({ it, afterEach }) => {
				afterEach(() => {
					throw error;
				});
				it("test 1", () => {});
				it("test 2", () => {});
			});

			assert.objEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.fail("test 1", error),
					TestResult.fail("test 2", error),
				]),
			);
		});

		it("runs afterEach() even when test throws exception", async() => {
			let afterEachRan = false;
			const suite = testSuite.test(({ it, afterEach }) => {
				afterEach(() => {
					afterEachRan = true;
				});
				it("my test", () => {
					throw new Error();
				});
			});

			await suite.runAsync();
			assert.equal(afterEachRan, true);
		});

		it("only reports test exception when both test and afterEach throw exceptions", async () => {
			const afterEachError = new Error("afterEach error");
			const testError = new Error("test error");

			const suite = testSuite.test(({ it, afterEach }) => {
				afterEach(() => {
					throw afterEachError;
				});
				it("my test", () => {
					throw testError;
				});
			});

			assert.objEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.fail("my test", testError),
				]),
			);
		});

	});


	describe("timeouts", ({ it }) => {

		it("times out when test doesn't complete in expected amount of time", async () => {
			const clock = Clock.createNull();

			let beforeTime = null;
			let afterTime = null;
			const suite = testSuite.test(({ it, beforeEach, afterEach }) => {
				beforeEach(() => {
					beforeTime = clock.now();
				});
				afterEach(() => {
					afterTime = clock.now();
				});
				it("my test", async () => {
					await clock.waitAsync(EXCEED_TIMEOUT);
				});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.timeout("my test", DEFAULT_TIMEOUT)
				]),
				"result",
			);
			assert.equal(beforeTime, 0, "beforeEach() should run immediately");
			assert.equal(afterTime, DEFAULT_TIMEOUT, "afterEach() should run as soon as it() times out");
		});

		it("times out when beforeAll doesn't complete in expected amount of time", async () => {
			const clock = Clock.createNull();

			let itTime = null;
			let afterTime = null;
			const suite = testSuite.test(({ it, beforeAll, afterAll }) => {
				beforeAll(async () => {
					await clock.waitAsync(EXCEED_TIMEOUT);
				});
				afterAll(() => {
					afterTime = clock.now();
				});
				it("my test", () => {
					itTime = clock.now();
				});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.timeout("beforeAll()", DEFAULT_TIMEOUT)
				]),
				"result",
			);
			assert.equal(itTime, null, "it() should not run");
			assert.equal(afterTime, null, "afterAll() should not run");
		});

		it("times out when afterAll doesn't complete in expected amount of time", async () => {
			const clock = Clock.createNull();

			let beforeTime = null;
			let itTime = null;
			const suite = testSuite.test(({ it, beforeAll, afterAll }) => {
				beforeAll(() => {
					beforeTime = clock.now();
				});
				afterAll(async () => {
					await clock.waitAsync(EXCEED_TIMEOUT);
				});
				it("test 1", () => {
					itTime = clock.now();
				});
				it("test 2", () => {});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.pass("test 1"),
					TestResult.pass("test 2"),
					TestResult.timeout("afterAll()", DEFAULT_TIMEOUT),
				]),
				"result",
			);
			assert.equal(beforeTime, 0, "beforeAll() should run immediately");
			assert.equal(itTime, 0, "it() should run immediately");
		});

		it("times out when beforeEach doesn't complete in expected amount of time", async () => {
			const clock = Clock.createNull();

			let itTime = null;
			let afterTime = null;
			const suite = testSuite.test(({ it, beforeEach, afterEach }) => {
				beforeEach(async () => {
					await clock.waitAsync(EXCEED_TIMEOUT);
				});
				afterEach(() => {
					afterTime = clock.now();
				});
				it("my test", () => {
					itTime = clock.now();
				});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.timeout("my test", DEFAULT_TIMEOUT)
				]),
				"result",
			);
			assert.equal(itTime, null, "it() should not run");
			assert.equal(afterTime, null, "afterEach() should not run");
		});

		it("times out when afterEach doesn't complete in expected amount of time", async () => {
			const clock = Clock.createNull();

			let beforeTime = null;
			let itTime = null;
			const suite = testSuite.test(({ it, beforeEach, afterEach }) => {
				beforeEach(() => {
					beforeTime = clock.now();
				});
				afterEach(async () => {
					await clock.waitAsync(EXCEED_TIMEOUT);
				});
				it("my test", () => {
					itTime = clock.now();
				});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.timeout("my test", DEFAULT_TIMEOUT)
				]),
				"result",
			);
			assert.equal(beforeTime, 0, "beforeEach() should run immediately");
			assert.equal(itTime, 0, "it() should run immediately");
		});

		it("times out each function separately", async () => {
			const clock = Clock.createNull();
			const notQuiteTimeoutFn = async () => {
				await clock.waitAsync(DEFAULT_TIMEOUT - 1);
			};

			const suite = testSuite.test(({ it, beforeAll, afterAll, beforeEach, afterEach }) => {
				beforeAll(notQuiteTimeoutFn);
				beforeAll(notQuiteTimeoutFn);
				afterAll(notQuiteTimeoutFn);
				afterAll(notQuiteTimeoutFn);
				beforeEach(notQuiteTimeoutFn);
				beforeEach(notQuiteTimeoutFn);
				afterEach(notQuiteTimeoutFn);
				afterEach(notQuiteTimeoutFn);
				it("test 1", notQuiteTimeoutFn);
				it("test 2", notQuiteTimeoutFn);
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.pass("test 1"),  // all tests pass because nothing timed out
					TestResult.pass("test 2"),
				]),
			);
		});

		it("allows suites to configure timeout", async () => {
			const NEW_TIMEOUT = DEFAULT_TIMEOUT * 10;

			const clock = Clock.createNull();
			const notQuiteTimeoutFn = async () => {
				await clock.waitAsync(NEW_TIMEOUT - 1);
			};

			const suite = testSuite.test(({
				it, timeout, beforeAll, afterAll, beforeEach, afterEach
			}) => {
				timeout(NEW_TIMEOUT);
				beforeAll(notQuiteTimeoutFn);
				afterAll(notQuiteTimeoutFn);
				beforeEach(notQuiteTimeoutFn);
				afterEach(notQuiteTimeoutFn);
				it("my test", notQuiteTimeoutFn);
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.pass("my test"),
				]),
			);
		});

		it("inherits parent's timeout", async () => {
			const NEW_TIMEOUT = DEFAULT_TIMEOUT * 10;

			const clock = Clock.createNull();
			const suite = testSuite.test(({ describe, timeout }) => {
				timeout(NEW_TIMEOUT);
				describe("child", ({ it }) => {
					it("my test", async () => {
						await clock.waitAsync(NEW_TIMEOUT - 1);
					});
				});
			});

			const actualPromise = suite.runAsync({ clock });
			await clock.advanceNulledClockUntilTimersExpireAsync();

			assert.objEqual(await actualPromise,
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.pass("my test"),
					]),
				]),
			);
		});

	});


	describe(".skip", ({ it }) => {

		it("skips tests that have no function", async () => {
			const suite = testSuite.test(({ it }) => {
				it("my test");
			});

			const result = await suite.runAsync();
			assert.objEqual(result.suite[0], TestResult.skip("my test"));
		});

		it("skips tests that have '.skip'", async () => {
			let testRan = false;
			const suite = testSuite.test(({ it }) => {
				it.skip("my test", () => {
					testRan = true;
				});
			});

			const result = await suite.runAsync();
			assert.equal(testRan, false, "should not run test");
			assert.objEqual(result.suite[0], TestResult.skip("my test"));
		});

		it("skips suites that have no function", async () => {
			const suite = testSuite.test();

			const result = await suite.runAsync();
			assert.objEqual(result, TestResult.suite("", []));
		});

		it("recursively skips everything within a suite that has '.skip'", async () => {
			const suite = testSuite.test.skip(({ describe, it }) => {
				it("test 1", () => {});
				it("test 2", () => {});
				describe("child", ({ it }) => {
					it("test 3", () => {});
				});
			});

			const result = await suite.runAsync();
			assert.objEqual(result,
				TestResult.suite("", [
					TestResult.skip("test 1"),
					TestResult.skip("test 2"),
					TestResult.suite("child", [
						TestResult.skip("test 3"),
					]),
				]),
			);
		});

	});


	describe(".only", ({ it }) => {

		it("if any tests are marked .only, it only runs those tests", async () => {
			const suite = testSuite.test(({ it }) => {
				it.only(".only", () => {});
				it("not .only", () => {});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.pass(".only"),
					TestResult.skip("not .only"),
				]),
			);
		});

		it("if a suite is marked .only and none of its tests are, runs all of those tests", async () => {
			const suite = testSuite.test(({ describe }) => {
				describe("not .only", ({ it }) => {
					it("test1", () => {});
					it("test2", () => {});
				});
				describe.only(".only", ({ it }) => {
					it("test3", () => {});
					it("test4", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("not .only", [
						TestResult.skip("test1"),
						TestResult.skip("test2"),
					]),
					TestResult.suite(".only", [
						TestResult.pass("test3"),
						TestResult.pass("test4"),
					]),
				]),
			);
		});

		it("if a suite is marked .only and none of its children are, run those tests recursively", async () => {
			const suite = testSuite.test.only(({ describe }) => {
				describe("child", ({ it }) => {
					it("test", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.pass("test"),
					]),
				]),
			);
		});

		it("if a suite is marked .only and a child is marked .skip, skip the child", async () => {
			const suite = testSuite.test.only(({ describe }) => {
				describe("child", ({ it }) => {
					it.skip("test1", () => {});
					it("test2", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.skip("test1"),
						TestResult.pass("test2"),
					]),
				]),
			);
		});

		it("if a suite is marked .skip and a child is marked .only, run the child", async () => {
			const suite = testSuite.test.skip(({ describe }) => {
				describe("child", ({ it }) => {
					it.only("test1", () => {});
					it("test2", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.pass("test1"),
						TestResult.skip("test2"),
					]),
				]),
			);
		});

		it("if a suite is marked .only and a child suite is marked .skip, skip its children", async () => {
			const suite = testSuite.test.only(({ describe }) => {
				describe.skip("child", ({ it }) => {
					it("test1", () => {});
					it("test2", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.skip("test1"),
						TestResult.skip("test2"),
					]),
				]),
			);
		});

		it("if a suite is marked .skip and a child suite is marked .only, run its children", async () => {
			const suite = testSuite.test.skip(({ describe }) => {
				describe.only("child", ({ it }) => {
					it("test1", () => {});
					it("test2", () => {});
				});
			});

			assert.deepEqual(await suite.runAsync(),
				TestResult.suite("", [
					TestResult.suite("child", [
						TestResult.pass("test1"),
						TestResult.pass("test2"),
					]),
				]),
			);
		});

	});

});


async function runTestAsync(testName, testFn) {
	const suite = testSuite.test(({ it }) => {
		it(testName, testFn);
	});
	const result = await suite.runAsync();
	return result.suite[0];
}
