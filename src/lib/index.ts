import * as prettierPlugin from "../plugin";
import * as prettier from "prettier";
import type { Options as PrettierOptions } from "prettier";
import type { JsonataASTNode } from "../types";
// import { locEnd, locStart } from "../plugin/parser";
import { print as printJsonata } from "../plugin/printer";

type SupportedPrettierOptions = Pick<PrettierOptions, "printWidth" | "tabWidth" | "useTabs">;

/**
 * Re-formats JSONata expression string in an opinionated way on where to put line breaks and whitespace.
 */
export async function formatJsonata(expression: string, options?: SupportedPrettierOptions): Promise<string> {
  clearPrettierCacheIfAvailable();

  return await prettier.format(expression, {
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
  // const pluginBoundToAST = buildPluginBoundToAST(jsonataAST);

  clearPrettierCacheIfAvailable();

  const rootNode = new prettier.AstPath<JsonataASTNode>(jsonataAST);

  const printOptions = {
    printWidth: 150,
    tabWidth: 2,
    useTabs: false,
    ...options,
  } as unknown as prettier.ParserOptions;

  type Selector = string | number | Array<string | number> | prettier.AstPath;

  const printChildren = (node: prettier.AstPath, path: Selector): prettier.Doc => {
    let childNode: prettier.AstPath<JsonataASTNode> | undefined;
    if (typeof path === "string") {
      childNode = new prettier.AstPath<JsonataASTNode>(node.node[path]);
    }
    if (Array.isArray(path) && typeof path[0] === "string" && typeof path[1] === "number") {
      childNode = new prettier.AstPath<JsonataASTNode>(node.node[path[0]][path[1]]);
    }

    if (childNode !== undefined) {
      return printJsonata(childNode, printOptions, (path: Selector) => {
        if (childNode !== undefined) {
          return printChildren(childNode, path);
        }

        return [];
      });
    }

    return [];
  };

  const jsonataDoc: prettier.Doc = printJsonata(rootNode, printOptions, (path: Selector) =>
    printChildren(rootNode, path),
  );

  return prettier.doc.printer.printDocToString(jsonataDoc, printOptions).formatted;

  // return await prettier.format("ignore text input", {
  //   parser: prettierPlugin.AST_PARSER_NAME,
  //   plugins: [pluginBoundToAST],
  //   printWidth: 150,
  //   tabWidth: 2,
  //   useTabs: false,
  //   ...options,
  // });
}

/**
 * Prettier does not allow to skip the "parse" step completely, and jump straight to converting AST to a formatted string,
 * but there are use-cases when we need to format only a part of the full AST tree without access to the original string representation of it.
 *
 * To work around it, we are adding this dynamic plugin generator, which returns its AST argument as the result of `parse` callback
 * without any parsing, ignoring text input.
 */
// const buildPluginBoundToAST = (jsonataAST: JsonataASTNode): prettier.Plugin => {
//   return {
//     ...prettierPlugin,
//     parsers: {
//       [prettierPlugin.AST_PARSER_NAME]: {
//         astFormat: prettierPlugin.AST_FORMAT_NAME,
//         parse: () => jsonataAST,
//         locStart,
//         locEnd,
//       },
//     },
//   };
// };

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
