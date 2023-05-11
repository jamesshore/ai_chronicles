// Copyright Titanium I.T. LLC.

import Build from "../util/build_lib.js";
import DependencyAnalysis from "../util/dependency_analysis.js";
import * as pathLib from "node:path";
import * as paths from "../config/paths.js";
import * as lint from "../runners/lint_runner.js";
import lintConfig from "../config/eslint.conf.js";
import shell from "shelljs";
import * as colors from "../util/colors.js";
import { pathToFile } from "../util/module_paths.js";
import * as sh from "../util/sh.js";
import * as tests from "../runners/test_runner.js";

shell.config.fatal = true;

const successColor = colors.brightGreen;
const failureColor = colors.brightRed;

const rootDir = pathToFile(import.meta.url, "../..");

const build = new Build({ incrementalDir: `${paths.incrementalDir}/tasks/` });
const analysis = new DependencyAnalysis(build, rootDir, paths.testDependencies());

export async function runBuildAsync(args) {
	try {
		await build.runAsync(args, successColor.inverse("   BUILD OK   "));
		return null;
	}
	catch (err) {
		console.log(`\n${failureColor.inverse("   BUILD FAILURE   ")}\n${failureColor.bold(err.message)}`);
		return err.failedTask;
	}
}

build.task("default", async() => {
	await build.runTasksAsync([ "clean", "quick", "bundle", "typecheck" ]);
});

build.task("quick", async () => {
	await build.runTasksAsync([ "lint", "test" ]);
});

build.task("clean", () => {
	console.log("Deleting generated files: .");
	shell.rm("-rf", `${paths.generatedDir}/*`);
});

build.task("lint", async () => {
	let header = "Linting JavaScript: ";
	let footer = "";

	const lintPromises = paths.lintFiles().map(async (lintFile) => {
		const lintDependency = lintDependencyName(lintFile);
		const modified = await build.isModifiedAsync(lintFile, lintDependency);
		if (!modified) return true;

		process.stdout.write(header);
		header = "";
		footer = "\n";
		const success = await lint.validateFileAsync(lintFile, lintConfig);
		if (success) build.writeDirAndFileAsync(lintDependency, "lint ok");

		return success;
	});

	const successes = await Promise.all(lintPromises);
	const overallSuccess = successes.every((success) => success === true);
	if (!overallSuccess) throw new Error("Lint failed");

	process.stdout.write(footer);
});


build.incrementalTask("test", paths.testDependencies(), async () => {
	await build.runTasksAsync([ "compile" ]);

	const { failed } = await tests.runAsync("Testing JavaScript", paths.testFiles());
	if (failed) throw new Error("Tests failed");
});

build.incrementalTask("bundle", paths.compilerDependencies(), async () => {
	await build.runTasksAsync([ "compile" ]);
	process.stdout.write("Bundling JavaScript: ");

	const { code } = await sh.runInteractiveAsync(paths.rollup, [
		"--failAfterWarnings",
		"--silent",
		"--config", `${paths.configDir}/rollup.conf.js`,
	]);
	if (code !== 0) throw new Error("Bundler failed");

	process.stdout.write(".");
	copyFrontEndFiles();
	process.stdout.write("\n");

	function copyFrontEndFiles() {
		paths.frontEndStaticFiles().forEach(file => {
			const relativePath = build.rootRelativePath(paths.frontEndSrcDir, file);
			const destFile = `${paths.bundleDir}/${relativePath}`;
			shell.mkdir("-p", pathLib.dirname(destFile));
			shell.cp(file, destFile);
			process.stdout.write(".");
		});
	}
});

build.incrementalTask("compile", paths.compilerDependencies(), async () => {
	process.stdout.write("Compiling JavaScript: ");

	const { code } = await sh.runInteractiveAsync(paths.swc, [
		"--config-file", `${paths.configDir}/swc.conf.json`,
		"--out-dir", paths.typescriptDir,
		"--quiet",
		paths.frontEndSrcDir
	]);
	if (code !== 0) throw new Error("Compile failed");

	process.stdout.write(".\n");
});

build.incrementalTask("typecheck", paths.compilerDependencies(), async () => {
	process.stdout.write("Type-checking JavaScript: ");

	const { code } = await sh.runInteractiveAsync(paths.tsc, []);
	if (code !== 0) throw new Error("Type check failed");

	process.stdout.write(".\n");
});


function lintDependencyName(filename) {
	return dependencyName(filename, "lint");
}

function dependencyName(filename, extension) {
	return `${paths.incrementalDir}/files/${build.rootRelativePath(rootDir, filename)}.${extension}`;
}