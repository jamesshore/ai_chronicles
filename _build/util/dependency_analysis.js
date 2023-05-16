// Copyright Titanium I.T. LLC.
import { readFileAsync, isModifiedAsync, isNewerThanAsync } from "./build_lib.js";

// Matches 'import ... from "file"' and 'export ... from "file"', and detects if it has '//' in front.
const IMPORT_REGEX = /(\/\/)?.*?\b(?:import|export) .*? from\s*?["'](.*?)["']/;

// Matches '// dependency_analysis: file'. For manually specifying dependencies that don't need require(). One per line.
const COMMENT_REGEX = /\/\/?\s*?dependency_analysis:\s*(.*?)\s*$/;

export default class DependencyAnalysis {

	constructor(build, eligibleFiles) {
		this._build = build;
		this._eligibleFiles = eligibleFiles;
		this._analysisCache = {};
	}

	async isDependencyModifiedAsync(file, fileToCompareAgainst) {
		const allDependencies = await this._getAllDependenciesAsync(file);
		const isNewer = await Promise.all(allDependencies.map(async (dependency) => {
			return await isModifiedAsync(dependency, fileToCompareAgainst);
		}));
		return isNewer.some((dependencyIsNewer) => dependencyIsNewer);
	}

	async updateAnalysisAsync() {
		await Promise.all(this._eligibleFiles.map(async (file) => {
			if (await isCachedAnalysisOutdated(this, file)) await getAnalysisAsync(this, file);
		}));
	}

	async _getAllDependenciesAsync(file, result = []) {
		if (result.includes(file)) return result;

		result.push(file);
		const directDependencies = (await getAnalysisAsync(this, file)).dependencies;
		await Promise.all(directDependencies.map(async (dependency) => {
			await this._getAllDependenciesAsync(dependency, result);
		}));

		return result;
	}

}

async function isCachedAnalysisOutdated(self, file) {
	const analysis = await self._analysisCache[file];
	if (analysis === undefined) return true;
	return await isNewerThanAsync(file, analysis.analyzedAt);

}

async function getAnalysisAsync(self, file) {
	try {
		if (self._analysisCache[file] === undefined) {
			self._analysisCache[file] = await performAnalysisAsync(self, file);
		}
		return self._analysisCache[file];
	}
	catch (err) {
		delete self._analysisCache[file];   // don't cache failed analysis
		throw err;
	}
}

async function performAnalysisAsync(self, file) {
	const analyzedAt = Date.now();
	const fileContents = await readFileAsync(file);
	return {
		analyzedAt,
		dependencies: await findDependenciesAsync(self, file, fileContents),
	};
}

async function findDependenciesAsync(self, file, fileContents) {
	const lines = fileContents.split("\n");
	const dependencies = await Promise.all(lines.map((line, index) => analyzeLineAsync(line, index + 1)));
	return dependencies.filter((line) => line !== null);

	async function analyzeLineAsync(line, lineNumber) {
		const relativeDependency = getRelativeDependencyForLine(line);
		if (relativeDependency === null) return null;

		try {
			const dependencyUrl = await import.meta.resolve(relativeDependency, `file://${file}`);
			if (!dependencyUrl.startsWith("file://")) return null;

			const dependency = dependencyUrl.substring("file://".length);
			return self._eligibleFiles.includes(dependency) ? dependency : null;
		}
		catch(err) {
			if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_INVALID_URL") {
				throw new Error(
					"Dependency analysis failed\n" +
					`Cannot find module '${relativeDependency}' in ${file}:${lineNumber}.`);
			}
			else {
				throw err;
			}
		}
	}

	function getRelativeDependencyForLine(line) {
		const importMatch = line.match(IMPORT_REGEX);
		const commentMatch = line.match(COMMENT_REGEX);

		if (importMatch !== null && importMatch[1] !== "//") return importMatch[2];
		else if (commentMatch !== null) return commentMatch[1];
		else return null;
	}
}
