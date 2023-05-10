// Copyright Titanium I.T. LLC. For license, see "README" or "LICENSE" file.

// A small modification to Chai. Why? Just to demonstrate how you can customize an assertion library
// without writing it all yourself. And because Chai isn't perfect.

import { assert as chai } from "chai";

const exports = chai;

// By default, Chai's assert.equal does type conversions. DO. NOT. WANT.
export const equal = chai.strictEqual;
export const deepEqual = chai.deepEqual;
export const isUndefined = chai.isUndefined;
export const isNotUndefined = chai.isNotUndefined;
export const atLeast = chai.isAtLeast;

export function objEqual(actual, expected, message) {
	checkExpected(expected);

	message = message ? `${message}: ` : "";
	chai.isDefined(actual, message);
	if (expected.equals === undefined) exports.fail(message + "'expected' does not have equals() method");
	if (!expected.equals(actual)) fail(message, "should be equal()", actual, expected);
}

export function objNotEqual(actual, expected, message) {
	checkExpected(expected);

	message = message ? `${message}: ` : "";
	chai.isDefined(actual, message);
	if (actual.equals === undefined) exports.fail(message + "does not have equals() method");
	exports.isFalse(actual.equals(expected), message + "expected '" + expected + "' and '" + actual + "' to be not be equal(), but they were");
}

export function includes(actual, expected, message) {
	checkExpected(expected);
	if (!actual.includes(expected)) {
		fail(message, `'${actual}' should include '${expected}'`);
	}
}

export function doesNotInclude(actual, expected, message) {
	checkExpected(expected);
	if (actual.includes(expected)) {
		fail(message, `'${actual}' should not include '${expected}'`);
	}
}

export async function throwsAsync(fnAsync, expectedRegexOrExactString, message) {
	try {
		await fnAsync();
	}
	catch (err) {
		if (expectedRegexOrExactString === undefined) return;
		if (typeof expectedRegexOrExactString === "string") {
			exports.equal(err.message, expectedRegexOrExactString, message);
		}
		else {
			exports.match(err.message, expectedRegexOrExactString, message);
		}
		return;
	}
	fail(message, "Expected exception");
}

export async function doesNotThrowAsync(fnAsync) {
	await fnAsync();
}

function fail(userMessage, assertionMessage) {
	userMessage = userMessage ? `${userMessage}: ` : "";
	chai.fail(`${userMessage}${assertionMessage}`);
}

function checkExpected(expected) {
	if (expected === undefined) chai.fail("'undefined' provided as expected value in assertion");
}
