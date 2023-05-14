// Copyright Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
import FakeTimers, { NodeTimer } from "@sinonjs/fake-timers";

const FAKE_START_TIME = 0;
const NOT_A_NULLED_CLOCK_MESSAGE = "Can't advance the clock because it isn't a nulled clock";

export interface NulledClockResponses {
	now: number,
}

type TimeoutHandle = number;

interface ClockGlobals {
	Date: typeof Date,
	setTimeout: (fn: (...args: any[]) => void, milliseconds: number) => TimeoutHandle,
	clearTimeout: (handle: TimeoutHandle) => void,
	setInterval: (fn: (...args: any[]) => void, milliseconds: number) => TimeoutHandle,
	clearInterval: (handle: TimeoutHandle) => void,
	advanceNulledClockAsync: (milliseconds: number) => void,
	advanceNulledClockUntilTimersExpireAsync: () => void,
}

export class Clock {

	private _globals: ClockGlobals;

	static create(): Clock {
		return new Clock({
			Date,
			setTimeout,
			clearTimeout,
			setInterval,
			clearInterval,
			advanceNulledClockAsync() { throw new Error(NOT_A_NULLED_CLOCK_MESSAGE); },
			advanceNulledClockUntilTimersExpireAsync() { throw new Error(NOT_A_NULLED_CLOCK_MESSAGE); }
		});
	}

	static createNull(options?: NulledClockResponses): Clock {
		return new Clock(fakeClockGlobals(options));
	}

	constructor(globals: ClockGlobals) {
		this._globals = globals;
	}

	now(): number {
		return this._globals.Date.now();
	}

	async waitAsync(milliseconds: number): Promise<void> {
		await new Promise((resolve) => {
			this._globals.setTimeout(resolve, milliseconds);
		});
	}

	repeat(milliseconds: number, fn: (...args: any[]) => void): () => void {
		const handle = this._globals.setInterval(fn, milliseconds);
		return () => this._globals.clearInterval(handle);
	}

	millisecondsSince(startAsDateOrMilliseconds: Date | number) {
		return this.now() - (startAsDateOrMilliseconds as number);
	}

	millisecondsUntil(endAsDateOrMilliseconds: Date | number) {
		return (endAsDateOrMilliseconds as number) - this.now();
	}

	async timeoutAsync<T>(
		milliseconds: number,
		promiseToWaitFor: () => Promise<T>,
		timeoutFnAsync: () => T | Promise<T>
	): Promise<T> {
		return await new Promise(async (resolve, reject) => {
			const timeoutToken = this._globals.setTimeout(async () => {
				try {
					const result = await timeoutFnAsync();
					resolve(result);
				}
				catch (err) {
					reject(err);
				}
			}, milliseconds);

			try {
				const result = await promiseToWaitFor();
				resolve(result);
			}
			catch (err) {
				reject(err);
			}
			finally {
				this._globals.clearTimeout(timeoutToken);
			}
		});
	}

	async advanceNulledClockAsync(milliseconds: number): Promise<void> {
		await this._globals.advanceNulledClockAsync(milliseconds);
	}

	async advanceNulledClockUntilTimersExpireAsync(): Promise<void> {
		await this._globals.advanceNulledClockUntilTimersExpireAsync();
	}

}


function fakeClockGlobals({
	now = FAKE_START_TIME,
} = {}): ClockGlobals {
	const fake = FakeTimers.createClock(now);

	return {
		Date: fake.Date,

		async advanceNulledClockAsync(milliseconds: number): Promise<void> {
			await fake.tickAsync(milliseconds);
		},

		async advanceNulledClockUntilTimersExpireAsync(): Promise<void> {
			await fake.runAllAsync();
		},

		setTimeout(fn, milliseconds): TimeoutHandle {
			return fake.setTimeout(fn, milliseconds) as TimeoutHandle;
		},

		clearTimeout(handle): void {
			return fake.clearTimeout(handle as number & NodeTimer);
		},

		setInterval(fn, milliseconds): TimeoutHandle {
			return fake.setInterval(fn, milliseconds) as TimeoutHandle;
		},

		clearInterval(handle) {
			return fake.clearInterval(handle as number & NodeTimer);
		},
	};

}
