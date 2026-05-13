const { pathsToModuleNameMapper } = require("ts-jest/utils");
const { compilerOptions } = require("../tsconfig.json");

const paths = compilerOptions.paths ? compilerOptions.paths : {};

module.exports = {
    rootDir: "../",
    setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
    testPathIgnorePatterns: [
        "<rootDir>/.next/",
        "<rootDir>/node_modules/",
        "<rootDir>/cypress/",
        "<rootDir>/webdriverio/",
    ],
    testEnvironment: "jest-environment-jsdom",
    testResultsProcessor: "jest-sonar-reporter",
    moduleNameMapper: {
        ...pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" }),
        ".+\\.(svg|png|jpg|scss|sass|css)$": "identity-obj-proxy",
        "src/(.*)$": "<rootDir>/src/$1",
        axios: "axios/dist/node/axios.cjs",
    },
};
