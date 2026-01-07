"use strict";

module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["./tests/jestSetup.ts"],
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
};
