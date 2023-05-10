// Copyright Titanium I.T. LLC.
import { Clock } from "../infrastructure/clock.js";
import { TestResult } from "./test_result.js";

// A simple but full-featured test runner. It allows me to get away from Mocha's idiosyncracies and have
// more control over test execution, while also shielding me from dependency churn.

const DEFAULT_TIMEOUT_IN_MS = 2000;
const RUN_OPTIONS_TYPE = [ undefined, {
	clock: [ undefined, Clock ],
	notifyFn: [ undefined, Function ],
}];
const RUN_STATE = {
	DEFAULT: "default",
	SKIP: "skip",
	ONLY: "only",
};

export function describe(name, suiteFn) {
	return TestSuite.describe(name, suiteFn, RUN_STATE.DEFAULT);
}
describe.skip = function(name, suiteFn) {
	return TestSuite.describe(name, suiteFn, RUN_STATE.SKIP);
};
describe.only = function(name, suiteFn) {
	return TestSuite.describe(name, suiteFn, RUN_STATE.ONLY);
};
describe.suite = function(suites) {
	return new TestSuite("", RUN_STATE.DEFAULT, { runnables: suites });
};
describe.fail = function(name, error) {
	return new TestSuite("", RUN_STATE.DEFAULT, { runnables: [ new FailureTestCase(name, error) ] });
};
describe.DEFAULT_TIMEOUT_IN_MS = DEFAULT_TIMEOUT_IN_MS;


class TestSuite {

	static describe(name, suiteFn, runState) {
		const suite = suiteFn === undefined ? {} : runSuiteFn(this, suiteFn);
		return new TestSuite(name, runState, suite);
	}

	constructor(name, runState, {
		runnables = [],
		beforeAllFns = [],
		afterAllFns = [],
		beforeEachFns = [],
		afterEachFns = [],
		timeout,
	}) {
		this._name = name;
		this._runState = runState;
		this._runnables = runnables;
		this._hasDotOnlyChildren = this._runnables.some(runnable => runnable._isDotOnly());
		this._allChildrenSkipped = this._runnables.every(runnable => runnable._isSkipped(this._runState));
		this._beforeAllFns = beforeAllFns;
		this._afterAllFns = afterAllFns;
		this._beforeEachFns = beforeEachFns;
		this._afterEachFns = afterEachFns;
		this._timeout = timeout;
	}

	get name() { return this._name; }

	set filename(filename) { this._filename = filename; }

	async runAsync({
		clock = Clock.create(),
		notifyFn = () => {},
	} = {}) {
		return await this._recursiveRunAsync(RUN_STATE.ONLY, [], [], {
			clock,
			notifyFn,
			timeout: this._timeout
		});
	}

	_isDotOnly() {
		return this._runState === RUN_STATE.ONLY || this._hasDotOnlyChildren;
	}

	_isSkipped() {
		return this._allChildrenSkipped;
	}

	async _recursiveRunAsync(parentRunState, parentBeforeEachFns, parentAfterEachFns, options) {
		const timeout = this._timeout ?? options.timeout ?? DEFAULT_TIMEOUT_IN_MS;
		options = { ...options, timeout };

		const clock = options.clock;
		let myRunState = this._runState;
		if (myRunState === RUN_STATE.DEFAULT) {
			myRunState = parentRunState;
			if (parentRunState === RUN_STATE.ONLY && this._hasDotOnlyChildren) myRunState = RUN_STATE.SKIP;
		}

		const beforeEachFns = [ ...parentBeforeEachFns, ...this._beforeEachFns ];
		const afterEachFns = [ ...this._afterEachFns, ...parentAfterEachFns ];

		if (!this._allChildrenSkipped) {
			const beforeResult = await runManyTestFnsAsync("beforeAll()", this._beforeAllFns, clock, options.timeout);
			if (!beforeResult.isSuccess()) return TestResult.suite(this._name, [ beforeResult ], this._filename);
		}

		const results = [];
		for await (const runnable of this._runnables) {
			results.push(await runnable._recursiveRunAsync(myRunState, beforeEachFns, afterEachFns, options));
		}

		if (!this._allChildrenSkipped) {
			const afterResult = await runManyTestFnsAsync("afterAll()", this._afterAllFns, clock, options.timeout);
			if (!afterResult.isSuccess()) results.push(afterResult);
		}

		return TestResult.suite(this._name, results, this._filename);
	}

}

function runSuiteFn(suite, suiteFn) {
	const runnables = [];
	const beforeAllFns = [];
	const afterAllFns = [];
	const beforeEachFns = [];
	const afterEachFns = [];
	let timeout;

	const describe = (name, suiteFn) => pushRunnable(TestSuite.describe(name, suiteFn, RUN_STATE.DEFAULT ));
	describe.skip = (name, suiteFn) => pushRunnable(TestSuite.describe(name, suiteFn, RUN_STATE.SKIP));
	describe.only = (name, suiteFn) => pushRunnable(TestSuite.describe(name, suiteFn, RUN_STATE.ONLY));

	const it = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.DEFAULT));
	it.skip = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.SKIP));
	it.only = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.ONLY));

	const beforeAll = (fnAsync) => { beforeAllFns.push(fnAsync); };
	const afterAll = (fnAsync) => { afterAllFns.push(fnAsync); };
	const beforeEach = (fnAsync) => { beforeEachFns.push(fnAsync); };
	const afterEach = (fnAsync) => { afterEachFns.push(fnAsync); };
	const timeoutFn = (newTimeout) => { timeout = newTimeout; };

	suiteFn({ describe, it, beforeAll, afterAll, beforeEach, afterEach, timeout: timeoutFn });
	return { runnables, beforeAllFns, afterAllFns, beforeEachFns, afterEachFns, timeout };

	function pushRunnable(runnable) {
		runnables.push(runnable);
		return runnable;
	}
}


class TestCase {

	constructor(name, testFn, runState) {
		this._name = name;
		this._testFn = testFn;
		this._runState = runState;
	}

	get name() { return this._name; }

	_isDotOnly() {
		return this._runState === RUN_STATE.ONLY;
	}

	_isSkipped(parentRunState) {
		const myRunState = this._runState === RUN_STATE.DEFAULT ? parentRunState : this._runState;

		return myRunState === RUN_STATE.SKIP || this._testFn === undefined;
	}

	async _recursiveRunAsync(parentRunState, beforeEachFns, afterEachFns, { clock, notifyFn, timeout }) {
		const result = this._isSkipped(parentRunState)
			? TestResult.skip(this._name)
			: await runTestAsync(this);

		notifyFn(result);
		return result;

		async function runTestAsync(self) {
			const beforeResult = await runManyTestFnsAsync(self._name, beforeEachFns, clock, timeout);
			if (!beforeResult.isSuccess()) return beforeResult;

			const itResult = await runOneTestFnAsync(self._name, self._testFn, clock, timeout);
			const afterResult = await runManyTestFnsAsync(self._name, afterEachFns, clock, timeout);

			if (!itResult.isSuccess()) return itResult;
			else return afterResult;
		}
	}
}


class FailureTestCase extends TestCase {

	constructor(name, error) {
		super(name, undefined, RUN_STATE.DEFAULT);
		this._error = error;
	}

	_recursiveRunAsync() {
		return TestResult.fail(this._name, this._error);
	}

}


async function runManyTestFnsAsync(name, fns, clock, timeout) {
	for await (const fn of fns) {
		const result = await runOneTestFnAsync(name, fn, clock, timeout);
		if (!result.isSuccess()) return result;
	}
	return TestResult.pass(name);
}

async function runOneTestFnAsync(name, fn, clock, timeout) {
	return await clock.timeoutAsync(timeout, async () => {
		try {
			await fn();
			return TestResult.pass(name);
		}
		catch (err) {
			return TestResult.fail(name, err);
		}
	}, () => {
		return TestResult.timeout(name, timeout);
	});
}
