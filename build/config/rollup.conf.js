// Copyright Titanium I.T. LLC.
import * as paths from "./paths.js";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonJs from "@rollup/plugin-commonjs";

// Rollup is our code bundler. Documentation at https://rollupjs.org/configuration-options/

export default {
	input: `${paths.typescriptDir}/src/front_end/index.js`,
	output: {
		file: paths.bundleFile,
		format: "iife",
		sourcemap: true,
		intro: "const process = { env: {} };"   // shim Node.js 'process' object used by jsx-runtime
	},
	plugins: [
		nodeResolve({
			modulePaths: [ `${paths.frontEndDir}/node_modules` ],
		}),
		commonJs(),
	],
};