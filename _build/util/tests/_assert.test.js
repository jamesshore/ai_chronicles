// Copyright Titanium I.T. LLC.
import { test } from "../tests.js";
import * as assert from "./assert.js";

export default test(({ describe }) => {

	describe("equal()", ({ it }) => {

		it("passes if actual strictly equals expected", () => {
			expectPass(() => {
				assert.equal("abc", "abc");
			});
		});

		it("fails if actual doesn't strictly equal expected", () => {
			expectFail(() => {
				assert.equal("1", 1);
			}, "expected equality", "1", 1);
		});

	});


	describe("deepEqual()", ({ it }) => {

		it("passes if all elements of actual strictly equals all elements of expected, recursively", () => {
			expectPass(() => {
				assert.deepEqual({
					a: 1,
					b: {
						c: 2,
					},
				}, {
					a: 1,
					b: {
						c: 2,
					},
				});
			});
		});

		it("fails if actual doesn't strictly and deeply equal expected", () => {
			const actual = {
				a: 1,
				b: {
					c: 2,
				},
			};
			const expected = {
				a: 1,
				b: {
					c: "2",
				},
			};
			expectFail(() => {
				assert.deepEqual(actual, expected);
			}, "expected deep equality", actual, expected);
		});

	});


	describe("matches()", ({ it }) => {

		it("passes if actual matches regex", () => {
			expectPass(() => {
				assert.match("abc", /b/);
			});
		});

		it("fails if actual doesn't match regex", () => {
			expectFail(() => {
				assert.match("abc", /x/);
			}, "should match regex", "abc", /x/);
		});

	});


	describe("matchesGroup()", ({ it }) => {

		it("passes if first group in regex matches expected text", () => {
			expectPass(() => {
				assert.matchesGroup("-abc-", /-(.*?)-/, "abc");
			});
		});

		it("when expected value is null, passes if first group in regex doesn't match", () => {
			expectPass(() => {
				assert.matchesGroup("-abc-", /x(.*?)x/, null);
			});
		});

		it("fails if first group doesn't match expected text", () => {
			expectFail(() => {
				assert.matchesGroup("-abc-", /-(.*?)-/, "xxx");
			}, "regex group: expected equality", "abc", "xxx");
		});

		it("fails if group not found", () => {
			expectFail(() => {
				assert.matchesGroup("-abc-", /x(.*?)x/, "abc");
			}, "regex group expected 'abc', but nothing was found (searched with /x(.*?)x/)");
		});

		it("when expected value is null, fails if first group in regex matches", () => {
			expectFail(() => {
				assert.matchesGroup("-abc-", /-(.*?)-/, null);
			}, "should not have found regex group, but it was 'abc' (searched with /-(.*?)-/)");
		});

		it("has optional failure message", () => {
			expectFail(() => {
				assert.matchesGroup("-actual-", /-(.*?)-/, "expected", "my failure message");
			}, "my failure message: expected equality", "actual", "expected");
		});

	});


	describe("includes()", ({ it }) => {

		it("passes if actual includes string", () => {
			expectPass(() => {
				assert.includes("abcdef", "bcd");
			});
		});


		it("fails if actual doesn't include string", () => {
			expectFail(() => {
				assert.includes("abcdef", "xxx");
			}, "actual value should include expected value", "abcdef", "xxx");
		});

	});


	describe("notIncludes()", ({ it }) => {

		it("passes if actual doesn't include string", () => {
			expectPass(() => {
				assert.notIncludes("abcdef", "xxx");
			});
		});


		it("fails if actual does include string", () => {
			expectFail(() => {
				assert.notIncludes("abcdef", "bcd");
			}, "actual value should not include expected value", "abcdef", "bcd");
		});

	});


	describe("objEqual()", ({ it }) => {

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


	describe("throwsAsync()", ({ it }) => {

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
			}, "expected equality", "my error", "not my error");
		});

		it("passes if function throws and error message doesn't match regex", async () => {
			await expectFailAsync(async () => {
				await assert.throwsAsync(
					() => Promise.reject(new Error("my complicated error message")),
					/not-found/
				);
			}, "should match regex", "my complicated error message", /not-found/);
		});

	});


	describe("doesNotThrowAsync()", ({ it }) => {

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
