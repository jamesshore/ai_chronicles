// Copyright Titanium I.T. LLC.
import { describe, it, assert } from "../tests.js";

describe("Assert", () => {

	describe("objEqual()", () => {

		it("passes if expected.equals() returns true", () => {
			const expected = { equals() { return true; }};
			expectPass(() => {
				assert.objEqual({}, expected);
			});
		});

		it("fails if expected.equals() returns false", () => {
			const expected = { equals() { return false; }};
			const actual = {};

			expectFail(() => {
				assert.objEqual(actual, expected);
			}, "should be equal()", actual, expected);
		});

		it("fails if expected.equals() doesn't exist", () => {
			expectFail(() => {
				assert.objEqual({}, {});
			}, "'expected' does not have equals() method");
		});

	});


	describe("includes()", () => {

		it("passes if actual includes string", () => {
			expectPass(() => {
				assert.includes("abcdef", "bcd");
			});
		});

		it("fails if actual doesn't include string", () => {
			expectFail(() => {
				assert.includes("abcdef", "xxx");
			}, "'abcdef' should include 'xxx'", "abcdef", "xxx");
		});

	});


	describe("notIncludes()", () => {

		it("passes if actual doesn't include string", function() {
			expectPass(() => {
				assert.doesNotInclude("abcdef", "xxx");
			});
		});


		it("fails if actual does include string", function() {
			expectFail(() => {
				assert.doesNotInclude("abcdef", "bcd");
			}, "'abcdef' should not include 'bcd'", "abcdef", "bcd");
		});

	});


	describe("throwsAsync()", () => {

		it("passes if function throws and there's no expectation", async () => {
			await expectPassAsync(async () => {
				await assert.throwsAsync(() => Promise.reject(new Error("any error")));
			});
		});

		it("passes if function throws and error message matches expected string", async () => {
			await expectPassAsync(async () => {
				await assert.throwsAsync(
					() => Promise.reject(new Error("my error")),
					"my error"
				);
			});
		});

		it("passes if function throws and error message matches regex", async () => {
			await expectPassAsync(async () => {
				await assert.throwsAsync(
					() => Promise.reject(new Error("my complicated error message")),
					/complicated/
				);
			});
		});

		it("fails if function doesn't throw", async () => {
			await expectFailAsync(async () => {
				await assert.throwsAsync(() => Promise.resolve());
			}, "Expected exception");
		});

		it("fails if function throws and error message doesn't match expected string", async () => {
			await expectFailAsync(async () => {
				await assert.throwsAsync(
					() => Promise.reject(new Error("my error")),
					"not my error"
				);
			}, "expected 'my error' to equal 'not my error'", "my error", "not my error");
		});

		it("passes if function throws and error message doesn't match regex", async () => {
			await expectFailAsync(async () => {
				await assert.throwsAsync(
					() => Promise.reject(new Error("my complicated error message")),
					/not-found/
				);
			}, "expected 'my complicated error message' to match /not-found/", "my complicated error message", /not-found/);
		});

	});


	describe("doesNotThrowAsync()", () => {

		it("passes if function does not throw exception", async () => {
			await expectPassAsync(async () => {
				await assert.doesNotThrowAsync(() => Promise.resolve());
			});
		});

		it("fails if function does throw exception", async () => {
			await expectFailAsync(async () => {
				await assert.doesNotThrowAsync(() => Promise.reject(new Error("my error")));
			}, "my error");
		});

	});

});

function expectPass(fn) {
	fn();
}

function expectFail(fn, expectedFailureMessage, actual, expected) {
	try {
		fn();
		assert.fail("Expected assertion to fail, but it passed");
	}
	catch (err) {
		checkError(err, actual, expected, expectedFailureMessage);
	}
}

async function expectPassAsync(fnAsync) {
	await fnAsync();
}

async function expectFailAsync(fnAsync, expectedFailureMessage, actual, expected) {
	try {
		await fnAsync();
		assert.fail("Expected assertion to fail, but it passed");
	}
	catch (err) {
		checkError(err, actual, expected, expectedFailureMessage);
	}
}

function checkError(err, actual, expected, expectedFailureMessage) {
	assert.equal(err.message, expectedFailureMessage, "failure message");
	check(err.expected, expected, "expected");
	check(err.actual, actual, "actual");

	function check(actual, expected, message) {
		if (actual === undefined) assert.isUndefined(actual, message);
		else assert.deepEqual(actual, expected, message);
	}
}
