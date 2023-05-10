// Copyright Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
import FakeTimers from "@sinonjs/fake-timers";

const FAKE_START_TIME = 0;

export class Clock {

	static create() {
		return new Clock({
			Date,
			setTimeout,
			clearTimeout,
			setInterval,
			clearInterval,
			tickAsync() { throw new Error("Can't advance the clock because it isn't a null clock"); },
			tickUntilTimersExpireAsync() { throw new Error("Can't advance the clock because it isn't a null clock"); }
		});
	}

	static createNull(options) {
		return new Clock(nullGlobals(options));
	}

	constructor(globals) {
		this._globals = globals;
	}

	now() {
		return this._globals.Date.now();
	}

	currentYearForUtc() {
		return new Date(this._globals.Date.now()).getUTCFullYear();
	}

	async waitAsync(milliseconds) {
		await new Promise((resolve) => {
			this._globals.setTimeout(resolve, milliseconds);
		});
	}

	repeat(milliseconds, fn) {
		const handle = this._globals.setInterval(fn, milliseconds);
		return () => this._globals.clearInterval(handle);
	}

	millisecondsSince(startAsDateOrMilliseconds) {
		return this.now() - startAsDateOrMilliseconds;
	}

	millisecondsUntil(endAsDateOrMilliseconds) {
		return endAsDateOrMilliseconds - this.now();
	}

	async timeoutAsync(milliseconds, fnAsync, timeoutFnAsync) {
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
				const result = await fnAsync();
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

	async tickAsync(milliseconds) {
		await this._globals.tickAsync(milliseconds);
	}

	async tickUntilTimersExpireAsync() {
		await this._globals.tickUntilTimersExpireAsync();
	}

}


function nullGlobals({
	now = FAKE_START_TIME,
} = {}) {
	const fake = FakeTimers.createClock(now);

	return {
		Date: fake.Date,

		async tickAsync(milliseconds) {
			await fake.tickAsync(milliseconds);
		},

		async tickUntilTimersExpireAsync() {
			await fake.runAllAsync();
		},

		setTimeout(fn, milliseconds) {
			return fake.setTimeout(fn, milliseconds);
		},

		clearTimeout(fn, milliseconds) {
			return fake.clearTimeout(fn, milliseconds);
		},

		setInterval(fn, milliseconds) {
			return fake.setInterval(fn, milliseconds);
		},

		clearInterval(fn, milliseconds) {
			return fake.clearInterval(fn, milliseconds);
		},
	};

}
