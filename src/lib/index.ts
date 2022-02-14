import * as prettierPlugin from "../plugin";
import * as prettier from "prettier";
import type { Options as PrettierOptions } from "prettier";
import type { JsonataASTNode } from "../types";
import { locEnd, locStart } from "../plugin/parser";

type SupportedPrettierOptions = Pick<PrettierOptions, "printWidth" | "tabWidth" | "useTabs">;

/**
 * Re-formats JSONata expression string in an opinionated way on where to put line breaks and whitespace.
 */
export function formatJsonata(expression: string, options?: SupportedPrettierOptions): string {
  clearPrettierCacheIfAvailable();

  return prettier.format(expression, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [prettierPlugin],
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  });
}

/**
 * Serializes JSONata AST to a formatted string representing JSONata expression.
 */
export function serializeJsonata(jsonataAST: JsonataASTNode, options?: SupportedPrettierOptions): string {
  const pluginBoundToAST = buildPluginBoundToAST(jsonataAST);

  clearPrettierCacheIfAvailable();

  return prettier.format("ignore text input", {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [pluginBoundToAST],
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  });
}

/**
 * Prettier does not allow to skip the "parse" step completely, and jump straight to converting AST to a formatted string,
 * but there are use-cases when we need to format only a part of the full AST tree without access to the original string representation of it.
 *
 * To work around it, we are adding this dynamic plugin generator, which returns its AST argument as the result of `parse` callback
 * without any parsing, ignoring text input.
 */
const buildPluginBoundToAST = (jsonataAST: JsonataASTNode): prettier.Plugin => {
  return {
    ...prettierPlugin,
    parsers: {
      [prettierPlugin.AST_PARSER_NAME]: {
        astFormat: prettierPlugin.AST_FORMAT_NAME,
        parse: () => jsonataAST,
        locStart,
        locEnd,
      },
    },
  };
};

/**
 * Allows to clear prettier cache when executed in nodejs (mostly in unit tests)
 */
function clearPrettierCacheIfAvailable() {
  // Because the issue with cache only happens in unit tests executed in nodejs,
  // and the `clearConfigCache` is only exposed by Prettier in nodejs (it's not present in the browser version of it),
  // we have to check for its presense before running the method.
  if ("clearConfigCache" in prettier) {
    prettier.clearConfigCache();
  }
}
