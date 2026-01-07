"use strict";

module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["./jestSetup.ts"],
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
};
