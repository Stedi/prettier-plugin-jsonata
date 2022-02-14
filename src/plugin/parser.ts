import type { Parser } from "prettier";
import type { JsonataASTNode, JsonataError } from "../types";
import jsonata from "jsonata";

export const parse: Parser<JsonataASTNode>["parse"] = (expression) => {
  try {
    return jsonata(expression).ast() as JsonataASTNode;
  } catch (e) {
    const error = e as JsonataError;
    const debugInfoKeys: Array<keyof JsonataError> = ["code", "position", "token"];
    const debugInfoParts = debugInfoKeys
      .filter((key) => error[key] !== undefined)
      .map((key) => `${key}: ${error[key]}`);

    const errorMessage = [error.message, ...debugInfoParts].join(", ");
    throw new Error(errorMessage);
  }
};

export const locStart: Parser<JsonataASTNode>["locStart"] = (node): number => node.position;

// JSONata AST is not storing info about the end position of a statement represented by a given node,
// therefore we can't populate the `locEnd` callback correctly.
export const locEnd: Parser<JsonataASTNode>["locEnd"] = (): number => 0;
