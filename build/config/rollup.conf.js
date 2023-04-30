// Copyright Titanium I.T. LLC.
import * as paths from "./paths.js";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonJs from "@rollup/plugin-commonjs";

// Rollup is our code bundler. Documentation at https://rollupjs.org/configuration-options/

export default {
	input: `${paths.typescriptDir}/index.js`,
	output: {
		file: `${paths.bundleDir}/bundle.js`,
		format: "iife",
		sourcemap: true,
	},
	plugins: [
		nodeResolve({
			modulePaths: [ `${paths.frontEndDir}/node_modules` ],
		}),
		commonJs(),
	],
};