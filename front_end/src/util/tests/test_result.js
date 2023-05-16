// Copyright Titanium I.T. LLC.
import * as util from "node:util";
import * as path from "node:path";
import * as colors from "./colors.js";

const failColor = colors.brightRed.inverse;
const passColor = colors.white;
const skipColor = colors.cyan.dim;
const timeoutColor = colors.purple.inverse;

const headerColor = colors.brightWhite.bold;
const highlightColor = colors.brightWhite;
const errorMessageColor = colors.brightRed;
const timeoutMessageColor = colors.purple;
const expectedColor = colors.green;
const actualColor = colors.brightRed;
const diffColor = colors.brightYellow.bold;

const PASS = "pass";
const FAIL = "fail";
const SKIP = "skip";
const TIMEOUT = "timeout";

const SUCCESS_MAP = {
	[PASS]: true,
	[FAIL]: false,
	[SKIP]: true,
	[TIMEOUT]: false,
};
const PROGRESS_RENDERING = {
	[PASS]: passColor("."),
	[FAIL]: failColor("X"),
	[SKIP]: skipColor("_"),
	[TIMEOUT]: timeoutColor("!"),
};
const ZERO_COUNT = {
	[PASS]: 0,
	[FAIL]: 0,
	[SKIP]: 0,
	[TIMEOUT]: 0,
	total: 0,
	successFiles: [],
};

export class TestResult {

	static get PASS() { return PASS; }
	static get FAIL() { return FAIL; }
	static get SKIP() { return SKIP; }
	static get TIMEOUT() { return TIMEOUT; }

	static suite(name, results, filename) {
		return new TestSuiteResult(name, results, filename);
	}

	static pass(name) {
		return new TestCaseResult(name, PASS);
	}

	static fail(name, error) {
		return new TestCaseResult(name, FAIL, { error });
	}

	static skip(name) {
		return new TestCaseResult(name, SKIP);
	}

	static timeout(name, timeout) {
		return new TestCaseResult(name, TIMEOUT, { timeout });
	}

}


class TestSuiteResult {

	constructor(name, results, filename) {
		this._name = name;
		this._parent = null;
		this._filename = filename;
		this.suite = results;
		results.forEach(result => { result._parent = this; });
	}

	get isSuite() { return true; }

	get name() {
		return determineName(this);
	}

	get filename() {
		return this._filename ?? this._parent?.filename;
	}

	set filename(value) {
		this._filename = value;
	}

	isSuccess() {
		return this.suite.every(result => result.isSuccess());
	}

	isPassed() {
		return this.suite.every(result => result.isPassed());
	}

	allFailures() {
		const failures = [];
		this.suite.forEach(result => {
			if (result.isSuite) result.allFailures().forEach(subFailure => failures.push(subFailure));
			else if (!result.isSuccess()) failures.push(result);
		});
		return failures;
	}

	summary() {
		const count = { ...ZERO_COUNT };

		this.suite.forEach(result => {
			if (result.isSuite) {
				const subCount = result.summary();
				count[PASS] += subCount[PASS];
				count[FAIL] += subCount[FAIL];
				count[SKIP] += subCount[SKIP];
				count[TIMEOUT] += subCount[TIMEOUT];
				count.total += subCount.total;
				count.successFiles = union(count.successFiles, subCount.successFiles);
			}
			else {
				count[result.status]++;
				count.total++;
			}
		});

		count.success = this.isSuccess();
		if (this.isPassed() && this.filename !== undefined) count.successFiles = [ this.filename, ...count.successFiles ];
		return count;

		function union(array1, array2) {
			const combinedArrays = [ ...array1, ...array2 ];
			const deduplicatedSet = new Set(combinedArrays);
			return [...deduplicatedSet];
		}
	}


	equals(that) {
		if (this.suite.length !== that.suite.length) return false;

		for (let i = 0; i < this.suite.length; i++) {
			const thisResult = this.suite[i];
			const thatResult = that.suite[i];
			if (!thisResult.equals(thatResult)) return false;
		}

		return this._name === that._name;
	}

}


class TestCaseResult {

	constructor(name, status, { error, timeout } = {}) {
		this._name = name;
		this._parent = null;
		this.status = status;
		this.error = error;
		this.timeout = timeout;
	}

	get isSuite() { return false; }

	get name() {
		return determineName(this);
	}

	get filename() {
		return this._parent?.filename;
	}

	isSuccess() {
		return SUCCESS_MAP[this.status];
	}

	isPassed() {
		return this.status === PASS;
	}

	renderProgress() {
		return PROGRESS_RENDERING[this.status];
	}

	render() {
		return renderName(this) + renderBody(this);
	}

	equals(that) {
		if (this.status !== that.status) return false;

		const sameError = this.error === undefined || this.error.message === that.error.message;
		return this._name === that._name &&
			sameError &&
			this.timeout === that.timeout;
	}

}

function determineName(testResult) {
	const baseName = [ testResult._name ];

	const parent = testResult._parent;
	if (parent === null) return baseName;

	const parentName = (parent.name.length === 1 && parent.name[0] === "")
		? []
		: parent.name;

	const filename = parent.filename === undefined
		? []
		: [ path.basename(parent.filename) ];

	return [ ...filename, ...parentName, ...baseName ];
}

function renderName(testCase) {
	const name = testCase.name;

	const suites = name.slice(0, name.length - 1);
	const test = name[name.length - 1];

	const suitesName = suites.length > 0 ? suites.join(" » ") + "\n» " : "";
	return headerColor(suitesName + test + "\n");
}

function renderBody(testCase) {
	const name = testCase.name;

	switch (testCase.status) {
		case PASS:
		case SKIP:
			return "";
		case FAIL:
			return renderFailure(testCase, name);
		case TIMEOUT:
			return timeoutMessageColor(`\nTimed out after ${testCase.timeout}ms\n`);
		default:
			throw new Error(`Unrecognized test result status: ${status}`);
	}
}

function renderFailure(testCase, name) {
	let error;
	if (testCase.error.stack === undefined) {
		error = errorMessageColor(`\n${testCase.error}\n`);
	} else {
		error = `\n${renderStack(testCase.error, testCase.filename)}\n` +
			highlightColor(`\n${name[name.length - 1]} »\n`) +
			errorMessageColor(`${testCase.error.message}\n`);
	}
	const diff = renderDiff(testCase.error);

	return `${error}${diff}`;
}

function renderStack(error, filename) {
	const stack = error.stack.split("\n");
	const highlighted = stack.map(line => {
		if (!line.includes(filename)) return line;

		line = line.replace(/    at/, "--> at");	// this code is vulnerable to changes in Node.js rendering
		return headerColor(line);
	});
	return highlighted.join("\n");
}

function renderDiff(error) {
	if (error.expected === undefined && error.actual === undefined) return "";
	if (error.expected === null && error.actual === null) return "";

	const expected = util.inspect(error.expected, { depth: Infinity }).split("\n");
	const actual = util.inspect(error.actual, { depth: Infinity }).split("\n");
	if (expected.length > 1 || actual.length > 1) {
		for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
			const expectedLine = expected[i];
			const actualLine = actual[i];


			if (expectedLine !== actualLine) {
				if (expected[i] !== undefined) expected[i] = diffColor(expected[i]);
				if (actual[i] !== undefined) actual[i] = diffColor(actual[i]);
			}
		}
	}

	return "\n" +
		expectedColor("expected: ") + expected.join("\n") + "\n" +
		actualColor("actual:   ") + actual.join("\n") + "\n";
}