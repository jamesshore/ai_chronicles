// Copyright Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
import glob from "glob";
import { pathToFile } from "../util/module_paths.js";

export const rootDir = pathToFile(import.meta.url, "../..");

export const buildDir = `${rootDir}/_build`;
export const configDir = `${buildDir}/config`;
const buildBinariesDir = `${buildDir}/node_modules/.bin`;

export const frontEndDir = `${rootDir}/front_end`;
export const frontEndSrcDir = `${frontEndDir}/src`;

export const backEndDir = `${rootDir}/back_end`;

export const generatedDir = `${rootDir}/generated`;
export const incrementalDir = `${generatedDir}/incremental-build`;
export const typescriptDir = `${generatedDir}/compiled-typescript`;
export const bundleSrc = `${typescriptDir}/front_end/src/index.js`;
export const bundleDir = `${generatedDir}/bundle`;
export const bundleFile = `${bundleDir}/bundle.js`;

export const buildScript = `${rootDir}/build.sh`;
export const tsc = `${buildBinariesDir}/tsc`;
export const swc = `${buildBinariesDir}/swc`;
export const rollup = `${buildBinariesDir}/rollup`;
export const httpServer = `${buildBinariesDir}/http-server`;

export const watchFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`${frontEndSrcDir}/**/*`,
	// `${backEndDir}/**/*`,
]);

export const watchRestartFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`${frontEndDir}/package.json`,
	`${rootDir}/tsconfig.json`,
	`${rootDir}/*.sh`,
], [
	`${buildDir}/node_modules/**/*`,
]);

export const lintFiles = memoizedDeglob([
	`${buildDir}/**/*.js`,
	`${frontEndSrcDir}/**/*.ts`,
	`${frontEndSrcDir}/**/*.tsx`,
], [
	`${buildDir}/node_modules/**/*`,
]);

export const frontEndStaticFiles = memoizedDeglob([
	`${frontEndSrcDir}/**/*.html`,
]);

export const compilerDependencies = memoizedDeglob([
	...frontEndStaticFiles(),
	`${frontEndSrcDir}/**/*.ts`,
	`${frontEndSrcDir}/**/*.tsx`,
]);

export const testFiles = memoizedDeglob([
	`${buildDir}/**/_*_test.js`,
	`${generatedDir}/typescript/**/_*_test.js`,
]);

export const testDependencies = memoizedDeglob([
	`${buildDir}/**/*.js`,
	...compilerDependencies(),
], [
	`${buildDir}/util/dependency_analysis.js`,
]);


function memoizedDeglob(patternsToFind, patternsToIgnore) {
	return memoize(() => {
		return deglob(patternsToFind, patternsToIgnore);
	});
}

// Cache function results for performance
function memoize(fn) {
	let cache;
	return function() {
		if (cache === undefined) {
			cache = fn();
		}
		return cache;
	};
}

function deglob(patternsToFind, patternsToIgnore) {
	let globPattern = patternsToFind;
	if (Array.isArray(patternsToFind)) {
		if (patternsToFind.length === 1) {
			globPattern = patternsToFind[0];
		}
		else {
			globPattern = "{" + patternsToFind.join(",") + "}";
		}
	}

	return glob.sync(globPattern, { ignore: patternsToIgnore });
}