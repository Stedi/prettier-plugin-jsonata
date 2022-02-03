import { Config } from "@jest/types";
import { commonConfig } from "./jest.common";

const config: Config.InitialOptions = {
  ...commonConfig,
  displayName: "unit",
  testMatch: ["**/*.unit.ts"],
};

export default config;
