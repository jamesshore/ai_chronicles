// Copyright Titanium I.T. LLC.

import parseArgs from "minimist";
import pathLib from "node:path";
import fs from "fs";
import { promisify } from "util";
import * as colors from "./colors.js";

const statAsync = promisify(fs.stat);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const timingColor = colors.white;

export async function timeAsync(fnAsync) {
	const start = Date.now();
	const result = await fnAsync();
	const elapsedTime = ((Date.now() - start) / 1000).toFixed(2);
	process.stdout.write(timingColor(` (${elapsedTime}s)\n`));

	return result;
}

export async function isAnyModifiedAsync(sources, target) {
	const modifiedPromises = sources.map((source) => isModifiedAsync(source, target));
	const modifiedResults = await Promise.all(modifiedPromises);
	return modifiedResults.some((success) => success === true);
}

export async function isModifiedAsync(source, target) {
	try {
		const [sourceStats, targetStats] = await Promise.all([statAsync(source), statAsync(target)]);
		return sourceStats.mtime > targetStats.mtime;
	}
	catch(err) {
		if (err.code === "ENOENT") return true;
		else throw err;
	}
}

export async function isNewerThanAsync(file, timestamp) {
	const fileStats = await statAsync(file);
	return fileStats.mtime > timestamp;
}

export async function readFileAsync(file) {
	const fileContents = await (promisify(fs.readFile))(file);
	return fileContents.toString();
}

export async function writeDirAndFileAsync(file, contents) {
	const dir = pathLib.dirname(file);
	await mkdirAsync(dir, { recursive: true });
	await writeFileAsync(file, contents);
}

export function rootRelativePath(rootDir, fullyQualifiedFilename) {
	return fullyQualifiedFilename.replace(`${rootDir}/`, "");
}

export class Build {

	constructor({ incrementalDir }) {
		this._taskFns = {};
		this._incrementalDir = incrementalDir;
	}

	async runAsync(args, successMessage) {
		const argv = parseArgs(args);
		if (argv.help || argv.h || argv.T) return showHelp(this._taskFns);
		const tasksToRun = argv._.length === 0 ? ["default"] : argv._;

		const buildStart = Date.now();
		await this.runTasksAsync(tasksToRun);
		const elapsedSeconds = (Date.now() - buildStart) / 1000;
		console.log(`\n${successMessage}\n(${elapsedSeconds.toFixed(2)}s)`);
		return elapsedSeconds;
	}

	async runTasksAsync(tasksToRun) {
		let currentTask;
		try {
			for (const task of tasksToRun) {
				currentTask = task;
				const unknownTasks = tasksToRun.filter((task) => this._taskFns[task] === undefined);
				if (unknownTasks.length > 0) {
					showHelp();
					throw new Error(`Unrecognized task(s): ${unknownTasks.join(", ")}`);
				}
				await this._taskFns[task]();
			}
		}
		catch (err) {
			if (err.failedTask === undefined) err.failedTask = currentTask;
			throw err;
		}
	}

	task(name, fn) {
		if (this._taskFns[name] === undefined) this._taskFns[name] = fn;
		else throw new Error(`Task already defined: ${name}`);
	}

	incrementalTask(taskName, sourceFiles, fn) {
		this.task(taskName, async () => {
			const taskFile = `${this._incrementalDir}${taskName}.task`;
			if (!(await isAnyModifiedAsync(sourceFiles, taskFile))) return;

			await fn();
			await writeDirAndFileAsync(taskFile, "ok");
		});
	}

}

function showHelp(taskFns) {
	const name = pathLib.basename(process.argv[1]).split(".")[0];
	console.log(`usage: ${name} [-h|--help|-T|--tasks] <tasks>`);
	console.log("--help  This message");
	if (taskFns !== undefined) {
		console.log();
		console.log("Available tasks:");
		Object.keys(taskFns).forEach((task) => console.log(`  ${task}`));
	}
}
