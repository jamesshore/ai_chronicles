// Copyright Titanium I.T. LLC.
import { test } from "./test_suite.js";

export default test(({ it }) => {

	it("Failed Test", () => {
		throw new Error("my failure");
	});

});