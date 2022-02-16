import type { Plugin } from "prettier";
import { locEnd, locStart, parse } from "./parser";
import { print } from "./printer";

export const AST_PARSER_NAME = "JSONata";
export const AST_FORMAT_NAME = "JSONataASTNode";

export const languages: Plugin["languages"] = [
  {
    name: "JSONata",
    extensions: ["jsonata", "JSONata"],
    parsers: [AST_PARSER_NAME],
  },
];

export const parsers: Plugin["parsers"] = {
  [AST_PARSER_NAME]: {
    astFormat: AST_FORMAT_NAME,
    parse,
    locStart,
    locEnd,
  },
};

export const printers: Plugin["printers"] = {
  [AST_FORMAT_NAME]: {
    print,
  },
};
