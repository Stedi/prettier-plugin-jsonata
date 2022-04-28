import type { Parser } from "prettier";
import type { JsonataError } from "jsonata";
import type { JsonataASTNode } from "../types";
import jsonata from "jsonata";

export interface JsonataComment {
  position: number;
  value: string;
}

export const parse: Parser<JsonataASTNode & { jsonataComments: JsonataComment[] }>["parse"] = (expression) => {
  try {
    const jsonataComments: JsonataComment[] = [];
    const commentMatches = expression.matchAll(/\/\*((\*(?!\/)|[^*])*)\*\//g);
    for (const commentMatch of commentMatches) {
      const matchedCommentPosition = commentMatch.index;
      if (matchedCommentPosition === undefined) continue;

      const matchedCommentBody = commentMatch[1];
      if (!matchedCommentBody) continue;

      jsonataComments.push({ position: matchedCommentPosition, value: matchedCommentBody.trim() });
    }

    const ast = jsonata(expression).ast() as JsonataASTNode;
    return { ...ast, jsonataComments };
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
