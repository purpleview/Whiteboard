// Jest configuration. The test files live next to the code (*.test.js).
module.exports = {
    testEnvironment: "node",
    // Coverage over the whole application code, not only over files a test happens
    // to import - otherwise the ratio would flatter untested modules by omission.
    collectCoverage: true,
    collectCoverageFrom: ["scripts/**/*.js", "src/js/**/*.js", "!**/*.test.js"],
    coverageDirectory: "coverage",
    // cobertura feeds the coverage stamp (metrics branch), json-summary the badge.
    coverageReporters: ["text", "cobertura", "json-summary"],
};
