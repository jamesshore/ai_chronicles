// Copyright Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
import glob from "glob";

export const buildDir = "build";
export const srcDir = "src";
export const frontEndSrcDir = "src/front_end";
export const backEndSrcDir = "src/back_end";

export const generatedDir = "generated";
export const incrementalDir = `${generatedDir}/incremental`;
export const typescriptDir = `${generatedDir}/typescript`;

export const watchFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`${srcDir}/**/*`,
]);

export const watchRestartFiles = memoizedDeglob([
	`${buildDir}/**/*`,
	`package.json`,
	`tsconfig.json`,
	`*.sh`,
], [
	`${buildDir}/node_modules/**/*`,
]);

export const lintFiles = memoizedDeglob([
	`*.js`,
	`${buildDir}/**/*.js`,
	`${frontEndSrcDir}/**/*.js`,
]);

export const sourcePackages = memoizedDeglob([
	`${frontEndSrcDir}/**/package.json`,
]);

export const compilerDependencies = memoizedDeglob([
	...sourcePackages(),
	`${frontEndSrcDir}/**/*.ts`,
]);

export const testFiles = memoizedDeglob([
	`${buildDir}/**/_*_test.js`,
	`${generatedDir}/typescript/**/_*_test.js`,
	`${generatedDir}/typescript/**/_*_test.cjs`,
	`${generatedDir}/typescript/**/_*_test.js`,
	`${generatedDir}/typescript/**/_*_test.ts`,
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