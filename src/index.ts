import * as prettierPlugin from "./prettierPlugin";
import * as prettier from "prettier";
import type { Options as PrettierOptions } from "prettier";
import type { JsonataASTNode } from "./types";

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
  const pluginBoundToAST = prettierPlugin.buildPluginBoundToAST(jsonataAST);

  clearPrettierCacheIfAvailable();

  // See explanation in src/prettierPlugin/index.ts
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
 * Allows to clear prettier cache when executed in nodejs (mostly in unit tests)
 */
function clearPrettierCacheIfAvailable() {
  // Because the issue with cache only happens in unit tests executed in nodejs,
  // and the `clearConfigCache` is only exposed by Prettier in nodejs (it's not present in the browser version of it),
  // we have to check for its presense before running this method.
  if ("clearConfigCache" in prettier) {
    prettier.clearConfigCache();
  }
}
