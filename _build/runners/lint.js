// Copyright (c) 2012-2018 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.

import eslint from "eslint";
import fs from "node:fs";
import { promisify } from "node:util";
import { Legacy } from "@eslint/eslintrc";
import lintConfig from "../config/eslint.conf.js";

const { ConfigArrayFactory } = Legacy;

const linter = new eslint.Linter();

export async function runAsync({ header = "Linting", files }) {
	if (files.length === 0) return;

	process.stdout.write(`${header}: `);
	const lintedFiles = await Promise.all(files.map(async (file) => {
		const success = await validateFileAsync(file, lintConfig);
		return success ? file : null;
	}));
	process.stdout.write("\n");

	return {
		failed: lintedFiles.some(file => file === null),
		passFiles: lintedFiles.filter(file => file !== null),
	};
}

async function validateFileAsync(filename, options) {
	const sourceCode = await promisify(fs.readFile)(filename, "utf8");
	return validateSource(sourceCode, options, filename);
}

function validateSource(sourceCode, options, description) {
	description = description ? description + " " : "";

	const configArrayFactory = new ConfigArrayFactory();
	const configArray = configArrayFactory.create(options);

	const messages = linter.verify(sourceCode, configArray);
	const pass = (messages.length === 0);

	if (pass) {
		process.stdout.write(".");
	}
	else {
		console.log("\n" + description + "failed");
		messages.forEach(function(error) {
			const code = eslint.SourceCode.splitLines(sourceCode)[error.line - 1];
			if (error.line !== 0) console.log(error.line + ": " + code?.trim());
			console.log("   " + error.message);
		});
	}
	return pass;
}
