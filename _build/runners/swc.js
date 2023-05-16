import { timeAsync, writeDirAndFileAsync } from "../util/build_lib.js";
import swc from "@swc/core";
import swcConfig from "../config/swc.conf.js";
import * as colors from "../util/colors.js";
import pathLib from "node:path";

const COMPILE_RESULT = {
  SUCCESS: "success",
  FAIL: "fail",
};

export async function runAsync(files, header) {
  if (files.length === 0) return { failed: false };

  return await timeAsync(async () => {
    process.stdout.write(`${header}: `);
    const compileResults = await Promise.all(files.map(async ({ sourceFile, compiledFile, sourceMapFile }) => {
      try {
        const { code, map } = await swc.transformFile(sourceFile, swcConfig);

        await writeDirAndFileAsync(compiledFile, code);
        await writeDirAndFileAsync(sourceMapFile, map);

        process.stdout.write(".");
        return COMPILE_RESULT.SUCCESS;
      } catch (err) {
        const failMessage = colors.brightWhite.underline(`${pathLib.basename(sourceFile)} failed:`);
        process.stdout.write(`\n\n${failMessage}${err.message}\n`);
        return COMPILE_RESULT.FAIL;
      }
    }));

    const failed = compileResults.some(entry => entry === COMPILE_RESULT.FAIL);
    return { failed };
  });
}
