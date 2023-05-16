// Copyright Titanium I.T. LLC.
import { suite, fail } from "./test_suite.js";
import { ConsoleOutput } from "../infrastructure/console_output.js";
import path from "node:path";

export class TestRunner {

	static create() {
		return new TestRunner(ConsoleOutput.createStdout());
	}

	constructor(output) {
		this._output = output;
	}

	async testFilesAsync(files, reportedFilenames = []) {
		const suitePromises = files.map(async (filename, i) => {
			const reportedFilename = reportedFilenames[i] ?? filename;
			try {
				const suite = (await import(filename)).default;
				if (suite?.runAsync === undefined) {
					return fail(path.basename(filename), `doesn't export a test suite: ${reportedFilename}:1`);
				}
				else {
					suite.filename = reportedFilename;
					return suite;
				}
			}
			catch(err) {
				return fail(`error when requiring ${path.basename(reportedFilename)}`, err);
			}
		});

		const suites = await Promise.all(suitePromises);
		return await this.testModuleAsync(suite(suites));
	}

	async testModuleAsync(module) {
		const result = await module.runAsync({ notifyFn: notifyFn.bind(this) });
		return writeReport(this._output, result);

		function notifyFn(result) {
			this._output.write(result.renderProgress());
		}
	}

}

function writeReport(output, result) {
	const failures = result.allFailures();
	const renderedFailures = failures.reduce((acc, failure) => acc + "\n\n" + failure.render(), "");

	if (failures.length > 0) output.write("\n" + renderedFailures);

	return result.summary();
}
