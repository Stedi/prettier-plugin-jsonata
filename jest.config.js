module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testPathIgnorePatterns: ["/node_modules/"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testRegex: "/test/.*\\.(test|spec)\\.ts$",
};
