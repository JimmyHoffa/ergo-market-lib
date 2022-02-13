module.exports = {
  testEnvironment: "node",
  collectCoverage: false,
  roots: ["src"],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/"],
  testMatch: [
    "<rootDir>/**/*.test.(ts|tsx|js)",
    "<rootDir>/*.test.(ts|tsx|js)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  watchPathIgnorePatterns: ["node_modules"],
};
