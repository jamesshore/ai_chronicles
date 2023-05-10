// Copyright Titanium I.T. LLC.
import EventEmitter from "node:events";
import { OutputTracker } from "./output_tracker.js";

const WRITE_EVENT = "write";

/** Wrapper for command-line processing */
export class ConsoleOutput {

	static createStdout() {
		return new ConsoleOutput(process.stdout);
	}

	static createStderr() {
		return new ConsoleOutput(process.stderr);
	}

	static createNull() {
		return new ConsoleOutput(new NullStream());
	}

	constructor(stream) {
		this._stream = stream;
		this._emitter = new EventEmitter();
	}

	write(text) {
		if (text instanceof Buffer) text = text.toString();

		this._stream.write(text);
		this._emitter.emit(WRITE_EVENT, text);
	}

	track() {
		return OutputTracker.create(this._emitter, WRITE_EVENT);
	}

}

class NullStream {
	write() {}
}