// Copyright Titanium I.T. LLC.

import Build from "../util/build_lib.js";
import DependencyAnalysis from "../util/dependency_analysis.js";
import * as pathLib from "node:path";
import * as paths from "../config/paths.js";
import * as lint from "../runners/lint.js";
import shell from "shelljs";
import * as colors from "../util/colors.js";
import * as sh from "../util/sh.js";
import * as tests from "../runners/tests.js";

shell.config.fatal = true;

const successColor = colors.brightGreen;
const failureColor = colors.brightRed;

const build = new Build({ incrementalDir: `${paths.incrementalDir}/tasks/` });

export async function runBuildAsync(args) {
	try {
		await build.runAsync(args, successColor.inverse("   BUILD OK   "));
		return null;
	}
	catch (err) {
		console.log(`\n${failureColor.inverse("   BUILD FAILURE   ")}\n${failureColor.bold(err.message)}`);
		// console.log(err.stack);
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
	const modifiedFiles = await Promise.all(paths.lintFiles().map(async (file) => {
		const modified = await build.isModifiedAsync(file, lintDependencyName(file));
		return modified ? file : null;
	}));
	const filesToLint = modifiedFiles.filter(file => file !== null);

	const { failed, passFiles } = await lint.runAsync({
		header: "Linting JavaScript",
		files: filesToLint,
	});

	await Promise.all(passFiles.map(async (file) => {
		build.writeDirAndFileAsync(lintDependencyName(file), "lint ok");
	}));
	if (failed) throw new Error("Lint failed");



	function lintDependencyName(filename) {
		return dependencyName(filename, "lint");
	}
});

let analysis = null;
build.incrementalTask("test", paths.testDependencies(), async () => {
	await build.runTasksAsync([ "compile" ]);

	if (analysis === null) {
		process.stdout.write("Analyzing JavaScript test dependencies: ");
		analysis = new DependencyAnalysis(build, paths.rootDir, paths.testDependencies());
		process.stdout.write(".\n");
	}
	else {
		await analysis.updateAnalysisAsync();
	}

	const testFiles = (await Promise.all(paths.testFiles().map(async (file) => {
		return await analysis.isDependencyModifiedAsync(file, testDependencyName(file)) ? file : null;
	})))
	.filter(file => file !== null);

	const { failed, passFiles } = await tests.runAsync({
		header: "Testing JavaScript",
		files: testFiles,
	});
	if (failed) throw new Error("Tests failed");

	await Promise.all(passFiles.map(async (file) => {
		await build.writeDirAndFileAsync(testDependencyName(file), "test ok");
	}));

	function testDependencyName(filename) {
		return dependencyName(filename, "test");
	}

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


function dependencyName(filename, extension) {
	return `${paths.incrementalDir}/files/${build.rootRelativePath(paths.rootDir, filename)}.${extension}`;
}