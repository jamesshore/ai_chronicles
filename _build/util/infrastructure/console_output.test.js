// Copyright Titanium I.T. LLC.
import { test, assert } from "../tests.js";
import childProcess from "node:child_process";
import { ConsoleOutput } from "./console_output.js";
import { pathToFile } from "../module_paths.js";
/* dependency: ./console_output.test.helper.js */

export default test(({ it }) => {

	it("real version writes to stdout (or stderr), null version doesn't", async () => {
		const { stdout, stderr } = await runModuleAsync(
			pathToFile(import.meta.url, "./console_output.test.helper.js"),
			{ failOnStderr: false }
		);
		assert.equal(stdout, "string stdout\nbuffer stdout\n");
		assert.equal(stderr, "string stderr\n");
	});

	it("tracks writes", () => {
		const stdout = ConsoleOutput.createNull();
		const track = stdout.track().data;

		stdout.write("string stdout");
		stdout.write(Buffer.from("buffer stdout"));
		assert.deepEqual(track, [
			"string stdout",
			"buffer stdout",
		]);
	});

});

export function runModuleAsync(absolutePath, { args = [], failOnStderr = true } = {}) {
	return new Promise((resolve, reject) => {
		const child = childProcess.fork(absolutePath, args, { stdio: "pipe" });

		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (data) => {
			stdout += data;
		});
		child.stderr.on("data", (data) => {
			stderr += data;
		});

		child.on("exit", (code) => {
			if (code !== 0 || (failOnStderr && stderr !== "")) {
				return reject(new Error(`Runner failed.\nstdout: ${stdout}\nstderr: ${stderr}`));
			}
			else {
				return resolve({ stdout, stderr });
			}
		});
	});
}
