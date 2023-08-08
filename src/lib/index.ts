import * as prettierPlugin from "../plugin";
import { format, printDocToStringSync, printAstToDocSync, printToDocSync } from "prettier/standalone";
import type { Plugin, Options as PrettierOptions } from "prettier";
import type { JsonataASTNode } from "../types";
import { locEnd, locStart } from "../plugin/parser";
import { print } from "../plugin/printer";

type SupportedPrettierOptions = Pick<PrettierOptions, "printWidth" | "tabWidth" | "useTabs">;

/**
 * Re-formats JSONata expression string in an opinionated way on where to put line breaks and whitespace.
 */
export async function formatJsonata(expression: string, options?: SupportedPrettierOptions): Promise<string> {
  return await format(expression, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [prettierPlugin],
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  });
}

export function formatJsonataSync(expression: string, options?: SupportedPrettierOptions): string {
  const doc = printToDocSync(expression, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [prettierPlugin],
    printer: {
      print,
    },
  });

  const { formatted } = printDocToStringSync(doc, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [prettierPlugin],
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  });

  return formatted;
}

export function serializeJsonataSync(jsonataAST: JsonataASTNode, options?: SupportedPrettierOptions): string {
  const pluginBoundToAST = buildPluginBoundToAST(jsonataAST);
  const doc = printAstToDocSync(jsonataAST, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [pluginBoundToAST],
    printer: {
      print,
    },
  });

  const { formatted } = printDocToStringSync(doc, {
    parser: prettierPlugin.AST_PARSER_NAME,
    plugins: [pluginBoundToAST],
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  });

  return formatted;
}

/**
 * Serializes JSONata AST to a formatted string representing JSONata expression.
 */
export async function serializeJsonata(
  jsonataAST: JsonataASTNode,
  options?: SupportedPrettierOptions,
): Promise<string> {
  const pluginBoundToAST = buildPluginBoundToAST(jsonataAST);

  return await format("ignore text input", {
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
const buildPluginBoundToAST = (jsonataAST: JsonataASTNode): Plugin => {
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
