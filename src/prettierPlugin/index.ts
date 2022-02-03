import type { Plugin } from "prettier";
import type { JsonataASTNode } from "../types";
import { locEnd, locStart, parse } from "./parser";
import { print } from "./printer";

export const AST_PARSER_NAME = "JSONata";
export const AST_FORMAT_NAME = "JSONataASTNode";

export const languages: Plugin["languages"] = [
  {
    name: "JSONata",
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

/**
 * Prettier does not allow to skip the "parse" step completely, and jump straight to converting AST to a formatted string,
 * but there are use-cases when we need to format only a part of the full AST tree without access to the original string representation of it.
 *
 * To work around it, we are adding this dynamic plugin generator, which returns its AST argument as the result of `parse` callback
 * without any parsing, ignoring text input.
 */
export const buildPluginBoundToAST = (jsonataAST: JsonataASTNode): Plugin => {
  return {
    languages,
    parsers: {
      [AST_PARSER_NAME]: {
        astFormat: AST_FORMAT_NAME,
        parse: () => jsonataAST,
        locStart,
        locEnd,
      },
    },
    printers,
  };
};
