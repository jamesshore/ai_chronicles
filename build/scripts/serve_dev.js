#!/usr/local/bin/node

// Automatically restarts server when files change.
//
// Thanks to Davide Alberto Molin for inspiring this code.
// See https://www.letscodejavascript.com/v3/comments/live/7 for details.

import { checkNodeVersion } from "../util/node_version_checker.js";
import gaze from "gaze";
import pathLib from "node:path";
import { spawn } from "node:child_process";
import * as paths from "../config/paths.js";
import colors from "../util/colors.js";

checkNodeVersion();

const watchColor = colors.cyan;
const errorColor = colors.brightRed.inverse;

const COMMAND = [
	`${paths.buildDir}/node_modules/.bin/http-server`,
	paths.typescriptDir,
	"--port", "5010",
	"-c-1", // disable caching
];

const commandName = pathLib.basename(COMMAND[0]);
const commandArgs = COMMAND.slice(1);

let child = null;

process.stdout.write("Starting file watcher: ");
gaze(paths.watchFiles(), function(err, watcher) {
	if (err) {
		console.log(errorColor("WATCH ERROR:"), err);
		return;
	}
	console.log(".\nWill restart server when files change.\n");

	watcher.on("all", (event, filepath) => {
		logEvent(event, filepath);
		kill(run);
	});
	run();
});

function run() {
	if (child) return;

	console.log(watchColor(`> ${commandName} ${commandArgs.join(" ")}`));
	child = spawn(COMMAND[0], commandArgs, { stdio: "inherit" });
	child.on("exit", function() {
		console.log(watchColor(`${commandName} exited\n`));
		child = null;
	});
}

function kill(callback) {
	if (child === null) return callback();

	console.log(watchColor(`> kill ${commandName}`));
	child.kill();
	child.on("exit", callback);
}

function logEvent(event, filepath) {
	if (filepath === undefined) return;

	const truncatedPath = pathLib.basename(pathLib.dirname(filepath)) + "/" + pathLib.basename(filepath);
	console.log(watchColor(`${event.toUpperCase()}: ${truncatedPath}`));
}

