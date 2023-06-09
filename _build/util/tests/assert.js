// Copyright (c) 2014-2018 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.

// ****
// An assertion library that works the way *I* want it to. <oldmanvoice>Get off my lawn!</oldmanvoice>
// ****

import { assert as chai } from "chai";
import util from "node:util";

export function fail(message, actual, expected) {
	chai.fail(actual, expected, message);
}

export function todo(message) {
	message = message ? `: ${message}` : "";
	fail(`TO DO${message}`);
}

export function defined(actual, message) {
	message = message ? `${message}: ` : "";
	if (actual === undefined) fail(message + "expected value, but was undefined");
}

export function isUndefined(actual, message) {
	chai.isUndefined(actual, message);
}

export function isTrue(actual, message) {
	chai.isTrue(actual, message);
}

export function isFalse(actual, message) {
	chai.isFalse(actual, message);
}

export function isNull(actual, message) {
	chai.isNull(actual, message);
}

export function isNotNull(actual, message) {
	chai.isNotNull(actual, message);
}

export function atLeast(actual, expected, message) {
	chai.isAtLeast(actual, expected, message);
}

export function atMost(actual, expected, message) {
	chai.isAtMost(actual, expected, message);
}

export function equal(actual, expected, message) {
	checkExpected(expected);
	if (expected !== actual) {
		internalFail(message, "expected equality", actual, expected);
	}
}

export function notEqual(actual, expected, message) {
	checkExpected(expected);
	chai.notStrictEqual(actual, expected, message);
}

export function deepEqual(actual, expected, message) {
	checkExpected(expected);
	if (!util.isDeepStrictEqual(actual, expected)) {
		internalFail(message, "expected deep equality", actual, expected);
	}
}

export function objEqual(actual, expected, message) {
	checkExpected(expected);

	message = message ? `${message}: ` : "";
	defined(actual, message);
	if (expected.equals === undefined) fail(message + "'expected' does not have equals() method");
	if (!expected.equals(actual)) internalFail(message, "should be equal()", actual, expected);
}

export function objNotEqual(actual, expected, message) {
	checkExpected(expected);

	message = message ? `${message}: ` : "";
	defined(actual, message);
	if (actual.equals === undefined) fail(message + "does not have equals() method");
	isFalse(actual.equals(expected), message + "expected '" + expected + "' and '" + actual + "' to be not be equal(), but they were");
}

export function between(value, min, max, message) {
	defined(value, message);
	message = message ? `${message}: ` : "";
	if (value < min || value > max) {
		fail(message + "expected value between " + min + " and " + max + " (inclusive), but was " + value);
	}
}

export function match(actual, expectedRegex, message) {
	if (!expectedRegex.test(actual)) internalFail(message, "should match regex", actual, expectedRegex);
}

export function matchesGroup(actual, regex, expectedMatch, message) {
	message = message ?? "regex group";
	const regexResult = regex.exec(actual);
	const actualMatch = regexResult === null ? null : regexResult[1];

	if (expectedMatch === null && actualMatch === null) {
		return;
	}
	else if (expectedMatch === null && actualMatch !== null) {
		fail(`should not have found ${message}, but it was '${actualMatch}' (searched with ${regex})`);
	}
	else if (expectedMatch !== null && actualMatch === null) {
		fail(`${message} expected '${expectedMatch}', but nothing was found (searched with ${regex})`);
	}
	else {
		equal(regexResult[1], expectedMatch, message);
	}
}

export function includes(actual, expected, message) {
	checkExpected(expected);
	if (!actual.includes(expected)) {
		internalFail(message, "actual value should include expected value", actual, expected);
	}
}

export function notIncludes(actual, expected, message) {
	checkExpected(expected);
	if (actual.includes(expected)) {
		internalFail(message, "actual value should not include expected value", actual, expected);
	}
}

export function doesNotThrow(fn, message) {
	chai.doesNotThrow(fn, undefined, undefined, message);
}

export function throws(fn, expected, message) {
	chai.throws(fn, expected, undefined, message);
}

export async function throwsAsync(fnAsync, expectedRegexOrExactString, message) {
	try {
		await fnAsync();
	}
	catch (err) {
		if (expectedRegexOrExactString === undefined) return;
		if (typeof expectedRegexOrExactString === "string") {
			equal(err.message, expectedRegexOrExactString, message);
		}
		else {
			match(err.message, expectedRegexOrExactString, message);
		}
		return;
	}
	internalFail(message, "Expected exception");
}

export async function doesNotThrowAsync(fnAsync) {
	await fnAsync();
}

function checkExpected(expected) {
	if (expected === undefined) fail("'undefined' provided as expected value in assertion");
}

function internalFail(userMessage, assertionMessage, actual, expected) {
	userMessage = userMessage ? `${userMessage}: ` : "";
	fail(`${userMessage}${assertionMessage}`, actual, expected);
}