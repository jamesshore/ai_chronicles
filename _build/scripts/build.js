// Copyright Titanium I.T. LLC.
import { Build, timeAsync, isModifiedAsync, rootRelativePath, writeDirAndFileAsync } from "../util/build_lib.js";
import DependencyAnalysis from "../util/dependency_analysis.js";
import * as pathLib from "node:path";
import * as paths from "../config/paths.js";
import * as lint from "../runners/lint.js";
import shell from "shelljs";
import * as colors from "../util/colors.js";
import * as sh from "../util/sh.js";
import childProcess from "node:child_process";
import { pathToFile } from "../util/module_paths.js";
import * as swc from "../runners/swc.js";

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

build.task("clean", async () => {
	await timeAsync(async () => {
		process.stdout.write("Deleting generated files: ");
		shell.rm("-rf", `${paths.generatedDir}/*`);
		process.stdout.write(".");
	});
});

build.task("lint", async () => {
	const modifiedFiles = await Promise.all(paths.lintFiles().map(async (file) => {
		const modified = await isModifiedAsync(file, lintDependencyName(file));
		return modified ? file : null;
	}));
	const filesToLint = modifiedFiles.filter(file => file !== null);

	const { failed, passFiles } = await lint.runAsync({
		header: "Linting JavaScript",
		files: filesToLint,
	});

	await Promise.all(passFiles.map(async (file) => {
		writeDirAndFileAsync(lintDependencyName(file), "lint ok");
	}));
	if (failed) throw new Error("Lint failed");

	function lintDependencyName(filename) {
		return dependencyName(filename, "lint");
	}
});

let analysis = null;

build.task("test", async () => {
	await build.runTasksAsync([ "compile" ]);

	await timeAsync(async () => {
		process.stdout.write("Analyzing JavaScript dependencies: ");
		if (analysis === null) {
			analysis = new DependencyAnalysis(build, paths.testDependencies());
		}
		await analysis.updateAnalysisAsync();
		process.stdout.write(".");
	});

	const testFiles = (await Promise.all(paths.testFiles().map(async (file) => {
		return await analysis.isDependencyModifiedAsync(file, testDependencyName(file)) ? file : null;
	})))
	.filter(file => file !== null);
	if (testFiles.length === 0) return;

	const { failed, passFiles } = await new Promise((resolve, reject) => {
		let result;

		const child = childProcess.fork(
			pathToFile(import.meta.url, "../runners/run_tests.js"),
			[ "Testing JavaScript", ...testFiles ],
			{ stdio: "inherit" }
		);
		child.on("message", (message) => {
			result = message;
		});
		child.on("exit", () => resolve(result));
	});
	if (failed) throw new Error("Tests failed");

	await Promise.all(passFiles.map(async (file) => {
		await writeDirAndFileAsync(testDependencyName(file), "test ok");
	}));

	function testDependencyName(filename) {
		return dependencyName(filename, "test");
	}

});

build.incrementalTask("bundle", paths.bundleDependencies(), async () => {
	await build.runTasksAsync([ "compile" ]);

	await timeAsync(async () => {

		process.stdout.write("Bundling JavaScript: ");
		const { code } = await sh.runInteractiveAsync(paths.rollup, [
			"--failAfterWarnings",
			"--silent",
			"--config", `${paths.configDir}/rollup.conf.js`,
		]);
		if (code !== 0) throw new Error("Bundler failed");

		process.stdout.write(".");
		copyFrontEndFiles();
		process.stdout.write(".");
	});

	function copyFrontEndFiles() {
		paths.frontEndStaticFiles().forEach(file => {
			const relativePath = rootRelativePath(paths.frontEndSrcDir, file);
			const destFile = `${paths.bundleDir}/${relativePath}`;
			shell.mkdir("-p", pathLib.dirname(destFile));
			shell.cp(file, destFile);
			process.stdout.write(".");
		});
	}
});

build.task("compile", async () => {
	await build.runTasksAsync([ "copyFrontEndModules" ]);

	const files = (await Promise.all(paths.compilerDependencies().map(async (sourceFile) => {
		const compiledFile = compilerDependencyName(sourceFile, ".js");
		const sourceMapFile = compilerDependencyName(sourceFile, ".js.map");

		const isModified = await isModifiedAsync(sourceFile, compiledFile);
		if (!isModified) return null;

		return { sourceFile, compiledFile, sourceMapFile };
	}))).filter(file => file !== null);

	const header = "Compiling JavaScript";
	const { failed } = await swc.runAsync(files, header);

	if (failed) throw new Error("Compile failed");

	function compilerDependencyName(filename, extension) {
		const parsedFilename = pathLib.parse(filename);
		const jsFilename = `${parsedFilename.dir}/${parsedFilename.name}${extension}`;
		return `${paths.typescriptDir}/${rootRelativePath(paths.rootDir, jsFilename)}`;
	}
});

build.incrementalTask("copyFrontEndModules", [ paths.frontEndPackageJson ], async () => {
	await timeAsync(async () => {
		process.stdout.write("Copying front-end modules: ");
		shell.mkdir("-p", paths.typescriptFrontEndDir);
		shell.cp(paths.frontEndPackageJson, paths.typescriptFrontEndDir);
		shell.cp("-r", paths.frontEndNodeModules, paths.typescriptFrontEndDir);
		process.stdout.write(".");
	});
});

build.incrementalTask("typecheck", paths.compilerDependencies(), async () => {
	await timeAsync(async () => {
		process.stdout.write("Type-checking JavaScript: ");
		const { code } = await sh.runInteractiveAsync(paths.tsc, ["-p", paths.tsConfig]);
		if (code !== 0) throw new Error("Type check failed");
		process.stdout.write(".");
	});
});

function dependencyName(filename, extension) {
	return `${paths.incrementalDir}/files/${rootRelativePath(paths.rootDir, filename)}.${extension}`;
}
