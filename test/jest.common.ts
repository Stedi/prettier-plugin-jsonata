import { Config } from "@jest/types";

const commonConfig: Config.InitialOptions = {
  testEnvironment: "node",
  rootDir: "../",
  moduleFileExtensions: ["js", "jsx", "ts"],
  testPathIgnorePatterns: ["jest.*.ts", "cdk.out", "dist"],
  transform: {
    "^.+\\.(t|j)s$": "@swc/jest",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setupAfterEnv.ts"],
};

export { commonConfig };
