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

export async function promiseResolvesAsync(promise, message) {
	const promiseResolves = await doesPromiseResolve(promise);
	if (!promiseResolves) fail(message, "Expected promise to resolve, but it didn't");
}

export async function promiseDoesNotResolveAsync(promise, message) {
	const promiseResolves = await doesPromiseResolve(promise);
	if (promiseResolves) fail(message, "Expected promise to not resolve, but it did");
}



async function doesPromiseResolve(promise) {
	let promiseResolved = false;
	promise.then(() => {
		promiseResolved = true;
	});

	await drainEventLoopAsync();
	return promiseResolved;
}

async function drainEventLoopAsync() {
	await new Promise((resolve, reject) => {
		// We call setImmediate() twice because some callbacks are executed after setImmediate.
		setImmediate(() => {
			setImmediate(resolve);
		});
	});
}

function fail(userMessage, assertionMessage) {
	userMessage = userMessage ? `${userMessage}: ` : "";
	chai.fail(`${userMessage}${assertionMessage}`);
}

function checkExpected(expected) {
	if (expected === undefined) chai.fail("'undefined' provided as expected value in assertion");
}
