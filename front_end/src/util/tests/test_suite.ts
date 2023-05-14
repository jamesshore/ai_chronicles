// Copyright Titanium I.T. LLC.
import { Clock } from "../../infrastructure/clock.js";
import { TestResult } from "./test_result.js";

// A simple but full-featured test runner. It allows me to get away from Mocha's idiosyncracies and have
// more control over test execution, while also shielding me from dependency churn.

// The TypeScript conversion is a bit of a hack job. This file could use some cleanup.

const RUN_STATE = {
	DEFAULT: "default",
	SKIP: "skip",
	ONLY: "only",
};

type RunState = string;

export const DEFAULT_TIMEOUT_IN_MS = 2000;

interface TestResultPlaceholder {
	isSuccess(): boolean,
}

interface Describe {
	(name: string, describeFn?: DescribeFunction): void,
	skip: (name: string, descrbeFn?: DescribeFunction) => void,
	only: (name: string, describeFn?: DescribeFunction) => void,
}

interface It {
	(name: string, itFn?: ItFunction): void;
	skip: (name: string, itFn?: ItFunction) => void,
	only: (name: string, itFn?: ItFunction) => void,
}

export interface TestHelpers {
	describe: Describe,
	it: It,
	beforeAll: TestDecoratorDefiner,
	afterAll: TestDecoratorDefiner,
	beforeEach: TestDecoratorDefiner,
	afterEach: TestDecoratorDefiner,
	timeout: (newTimeout: Milliseconds) => void,
}

interface Runnable {
	get name(): string,
	_isDotOnly: () => boolean,
	_isSkipped: (runState: RunState) => boolean,
	_recursiveRunAsync: (
		parentRunState: RunState,
		parentBeforeEachFns: TestDecorator[],
		parentAfterEachFns: TestDecorator[],
		options: RecursiveRunOptions,
	) => Promise<TestResultPlaceholder> | TestResultPlaceholder,
}

export type DescribeFunction = (testUtilities: TestHelpers) => void;
export type ItFunction = () => void;
export type TestDecorator = () => Promise<void> | void;
export type TestDecoratorDefiner = (fn: TestDecorator) => void;
type Milliseconds = number;

interface RecursiveRunOptions {
	clock: Clock,
	notifyFn: (result: TestResultPlaceholder) => void,
	timeout?: Milliseconds,
}

export function test(describeFn: DescribeFunction): TestSuite {
	return TestSuite.describe("", describeFn, RUN_STATE.DEFAULT);
}
test.skip = function(describeFn: DescribeFunction): TestSuite {
	return TestSuite.describe("", describeFn, RUN_STATE.SKIP);
};
test.only = function(describeFn: DescribeFunction): TestSuite {
	return TestSuite.describe("", describeFn, RUN_STATE.ONLY);
};

export function suite(runnables: Runnable[]): TestSuite {
	return new TestSuite("", RUN_STATE.DEFAULT, { runnables });
}

export function fail(name: string, error: Error): TestSuite {
	return new TestSuite("", RUN_STATE.DEFAULT, { runnables: [ new FailureTestCase(name, error) ] });
}


class TestSuite implements Runnable {

	private _runnables: Runnable[];
	private _beforeAllFns: TestDecorator[];
	private _afterAllFns: TestDecorator[];
	private _beforeEachFns: TestDecorator[];
	private _afterEachFns: TestDecorator[];
	private _timeout?: Milliseconds;
	private _hasDotOnlyChildren: boolean;
	private _allChildrenSkipped: boolean;
	private _filename?: string;

	static describe(name: string, describeFn: DescribeFunction | undefined, runState: RunState) {
		const suite = describeFn === undefined ? {} : runDescribeFunction(describeFn);
		return new TestSuite(name, runState, suite);
	}

	constructor(private readonly _name: string, private readonly _runState: RunState, {
		runnables = [],
		beforeAllFns = [],
		afterAllFns = [],
		beforeEachFns = [],
		afterEachFns = [],
		timeout,
	}: {
		runnables?: Runnable[],
		beforeAllFns?: TestDecorator[],
		afterAllFns?: TestDecorator[],
		beforeEachFns?: TestDecorator[],
		afterEachFns?: TestDecorator[],
		timeout?: Milliseconds,
	}) {
		this._runnables = runnables;
		this._hasDotOnlyChildren = this._runnables.some(runnable => runnable._isDotOnly());
		this._allChildrenSkipped = this._runnables.every(runnable => runnable._isSkipped(this._runState));
		this._beforeAllFns = beforeAllFns;
		this._afterAllFns = afterAllFns;
		this._beforeEachFns = beforeEachFns;
		this._afterEachFns = afterEachFns;
		this._timeout = timeout;
	}

	get name(): string { return this._name; }

	set filename(filename: string) { this._filename = filename; }

	async runAsync({
		clock = Clock.create(),
		notifyFn = () => {},
	}: {
		clock?: Clock,
		notifyFn?: (result?: TestResultPlaceholder) => void;
	} = {}): Promise<TestResultPlaceholder> {
		return await this._recursiveRunAsync(RUN_STATE.ONLY, [], [], {
			clock,
			notifyFn,
			timeout: this._timeout
		});
	}

	_isDotOnly(): boolean {
		return this._runState === RUN_STATE.ONLY || this._hasDotOnlyChildren;
	}

	_isSkipped(): boolean {
		return this._allChildrenSkipped;
	}

	async _recursiveRunAsync(
		parentRunState: RunState,
		parentBeforeEachFns: TestDecorator[],
		parentAfterEachFns: TestDecorator[],
		options: RecursiveRunOptions,
	): Promise<TestResultPlaceholder> {
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
			const beforeResult = await runManyDecoratorFnsAsync("beforeAll()", this._beforeAllFns, clock, options.timeout);
			if (!beforeResult.isSuccess()) return TestResult.suite(this._name, [ beforeResult ], this._filename);
		}

		const results = [];
		for await (const runnable of this._runnables) {
			results.push(await runnable._recursiveRunAsync(myRunState, beforeEachFns, afterEachFns, options));
		}

		if (!this._allChildrenSkipped) {
			const afterResult = await runManyDecoratorFnsAsync("afterAll()", this._afterAllFns, clock, options.timeout);
			if (!afterResult.isSuccess()) results.push(afterResult);
		}

		return TestResult.suite(this._name, results, this._filename);
	}

}

function runDescribeFunction(
	describeFn: DescribeFunction
): {
	runnables: Runnable[],
	beforeAllFns: TestDecorator[],
	afterAllFns: TestDecorator[],
	beforeEachFns: TestDecorator[],
	afterEachFns: TestDecorator[],
	timeout?: Milliseconds,
} {
	const runnables: Runnable[] = [];
	const beforeAllFns: TestDecorator[] = [];
	const afterAllFns: TestDecorator[] = [];
	const beforeEachFns: TestDecorator[] = [];
	const afterEachFns: TestDecorator[] = [];
	let timeout: number | undefined;

	const describe: Describe = (name, describeFn) => pushRunnable(TestSuite.describe(name, describeFn, RUN_STATE.DEFAULT ));
	describe.skip = (name, describeFn) => pushRunnable(TestSuite.describe(name, describeFn, RUN_STATE.SKIP));
	describe.only = (name, describeFn) => pushRunnable(TestSuite.describe(name, describeFn, RUN_STATE.ONLY));

	const it: It = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.DEFAULT));
	it.skip = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.SKIP));
	it.only = (name, testFn) => pushRunnable(new TestCase(name, testFn, RUN_STATE.ONLY));

	const beforeAll: TestDecoratorDefiner = (fnAsync) => { beforeAllFns.push(fnAsync); };
	const afterAll: TestDecoratorDefiner = (fnAsync) => { afterAllFns.push(fnAsync); };
	const beforeEach: TestDecoratorDefiner = (fnAsync) => { beforeEachFns.push(fnAsync); };
	const afterEach: TestDecoratorDefiner = (fnAsync) => { afterEachFns.push(fnAsync); };
	const timeoutFn = (newTimeout: Milliseconds) => { timeout = newTimeout; };

	describeFn({ describe, it, beforeAll, afterAll, beforeEach, afterEach, timeout: timeoutFn });
	return { runnables, beforeAllFns, afterAllFns, beforeEachFns, afterEachFns, timeout };

	function pushRunnable(runnable: Runnable): Runnable {
		runnables.push(runnable);
		return runnable;
	}
}


class TestCase implements Runnable {

	constructor(
		protected readonly _name: string,
		private readonly _itFn: ItFunction | undefined,
		private readonly _runState: RunState) {
	}

	get name() { return this._name; }

	_isDotOnly(): boolean {
		return this._runState === RUN_STATE.ONLY;
	}

	_isSkipped(parentRunState: RunState): boolean {
		const myRunState = this._runState === RUN_STATE.DEFAULT ? parentRunState : this._runState;

		return myRunState === RUN_STATE.SKIP || this._itFn === undefined;
	}

	async _recursiveRunAsync(
		parentRunState: RunState,
		beforeEachFns: TestDecorator[],
		afterEachFns: TestDecorator[],
		{ clock, notifyFn, timeout }: RecursiveRunOptions
	): Promise<TestResultPlaceholder> {
		const result = this._isSkipped(parentRunState)
			? TestResult.skip(this._name)
			: await runTestAsync(this);

		notifyFn(result);
		return result;

		async function runTestAsync(self: TestCase) {
			const beforeResult = await runManyDecoratorFnsAsync(self._name, beforeEachFns, clock, timeout);
			if (!beforeResult.isSuccess()) return beforeResult;

			const itResult = await runOneTestFnAsync(self._name, self._itFn, clock, timeout);
			const afterResult = await runManyDecoratorFnsAsync(self._name, afterEachFns, clock, timeout);

			if (!itResult.isSuccess()) return itResult;
			else return afterResult;
		}
	}
}


class FailureTestCase extends TestCase {

	constructor(name: string, private readonly _error: Error) {
		super(name, undefined, RUN_STATE.DEFAULT);
	}

	override _recursiveRunAsync(
		parentRunState: RunState,
		beforeEachFns: TestDecorator[],
		afterEachFns: TestDecorator[],
		options: RecursiveRunOptions
	): Promise<TestResultPlaceholder> {
		return Promise.resolve(TestResult.fail(this._name, this._error));
	}

}


async function runManyDecoratorFnsAsync(
	name: string,
	fns: TestDecorator[],
	clock: Clock,
	timeout?: Milliseconds
): Promise<TestResultPlaceholder> {
	for await (const fn of fns) {
		const result = await runOneTestFnAsync(name, fn, clock, timeout);
		if (!result.isSuccess()) return result;
	}
	return TestResult.pass(name);
}

async function runOneTestFnAsync(
	name: string,
	fn: ItFunction | TestDecorator | undefined,
	clock: Clock,
	timeout?: Milliseconds
): Promise<TestResultPlaceholder> {
	return await clock.timeoutAsync(timeout!, async () => {
		try {
			await fn!();
			return TestResult.pass(name);
		}
		catch (err) {
			return TestResult.fail(name, err);
		}
	}, () => {
		return TestResult.timeout(name, timeout);
	});
}
