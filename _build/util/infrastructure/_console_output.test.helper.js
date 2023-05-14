// Copyright Titanium I.T. LLC.
import { ConsoleOutput } from "./console_output.js";

ConsoleOutput.createStdout().write("string stdout\n");
ConsoleOutput.createStdout().write(Buffer.from("buffer stdout\n"));
ConsoleOutput.createStderr().write("string stderr\n");
ConsoleOutput.createNull().write("null stdout\n");
