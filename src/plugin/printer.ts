import type {
  ApplyNode,
  ArrayUnaryNode,
  BinaryNode,
  BindNode,
  BlockNode,
  ConditionNode,
  DescendantNode,
  FilterNode,
  FunctionNode,
  PartialFunctionNode,
  JsonataASTNode,
  LambdaNode,
  NameNode,
  NumberNode,
  ObjectUnaryNode,
  ParentNode,
  PathNode,
  SortNode,
  StringNode,
  UnaryNode,
  ValueNode,
  VariableNode,
  WildcardNode,
  OperatorNode,
  NegationUnaryNode,
  RegexNode,
} from "../types";
import * as prettier from "prettier";
import type { AstPath, Doc, Options, Printer } from "prettier";
import { JsonataComment } from "./parser";

// We have to redefine this type, because @types/prettier contain incorrect (reduced) version
// of the type of the 3rd argument for Printer["print"]
type PrintChildrenFunction = (selector?: string | number | Array<string | number> | AstPath) => Doc;
type JsonataASTNodeWithComments = JsonataASTNode | (JsonataASTNode & { jsonataComments: JsonataComment[] });

// Due to the nature of the prettier printer API and the lack of proper support for comments in Jsonata AST,
// we have to populate `jsonataComments` from within the initial `print` function call,
// and then track `previousNodePosition` position to know when to print comments.
let jsonataComments: JsonataComment[] = [];
let previousNodePosition = -1;

export const print: Printer["print"] = (path, options, printChildren) => {
  const node: JsonataASTNodeWithComments = path.getValue();

  if ("jsonataComments" in node) {
    previousNodePosition = -1;
    jsonataComments = node.jsonataComments;
  }

  const nodePosition = (node.type === "path" ? node.steps[0]?.position : node.position) ?? previousNodePosition;

  const matchingComments = jsonataComments.filter(
    (comment) => comment.position > previousNodePosition && comment.position < nodePosition,
  );
  previousNodePosition = nodePosition;

  const commentsDoc = matchingComments.map(printComment);
  const result = printNode(node, path, options, printChildren as PrintChildrenFunction);

  if (commentsDoc.length > 0) {
    return group([commentsDoc, result]);
  }

  return result;
};

const printNode: PrintNodeFunction = (node, ...commonPrintArgs) => {
  if (node.type === "binary") {
    return printBinaryNode(node, ...commonPrintArgs);
  } else if (node.type === "function") {
    return printFunctionNode(node, ...commonPrintArgs);
  } else if (node.type === "partial") {
    return printFunctionNode(node, ...commonPrintArgs);
  } else if (node.type === "variable") {
    return printVariableNode(node, ...commonPrintArgs);
  } else if (node.type === "wildcard") {
    return printWildcardNode(node, ...commonPrintArgs);
  } else if (node.type === "descendant") {
    return printDescendantNode(node, ...commonPrintArgs);
  } else if (node.type === "operator") {
    return printOperatorNode(node, ...commonPrintArgs);
  } else if (node.type === "number") {
    return printNumberNode(node, ...commonPrintArgs);
  } else if (node.type === "string") {
    return printStringNode(node, ...commonPrintArgs);
  } else if (node.type === "name") {
    return printNameNode(node, ...commonPrintArgs);
  } else if (node.type === "filter") {
    return printFilterNode(node, ...commonPrintArgs);
  } else if (node.type === "bind") {
    return printBindNode(node, ...commonPrintArgs);
  } else if (node.type === "lambda") {
    return printLambdaNode(node, ...commonPrintArgs);
  } else if (node.type === "condition") {
    return printConditionNode(node, ...commonPrintArgs);
  } else if (node.type === "value") {
    return printValueNode(node, ...commonPrintArgs);
  } else if (node.type === "block") {
    return printBlockNode(node, ...commonPrintArgs);
  } else if (node.type === "path") {
    return printPathNode(node, ...commonPrintArgs);
  } else if (node.type === "apply") {
    return printApplyNode(node, ...commonPrintArgs);
  } else if (node.type === "sort") {
    return printSortNode(node, ...commonPrintArgs);
  } else if (node.type === "unary") {
    return printUnaryNode(node, ...commonPrintArgs);
  } else if (node.type === "parent") {
    return printParentNode(node, ...commonPrintArgs);
  } else if (node.type === "regex") {
    return printRegEx(node, ...commonPrintArgs);
  }

  throw new Error(`Unknown node type: ${(node as JsonataASTNode).type}`);
};

type PrintNodeFunction<T extends JsonataASTNode = JsonataASTNode> = (
  node: T,
  path: AstPath,
  options: Options,
  printChildren: PrintChildrenFunction,
) => Doc;

const { group, indent, join, line, hardline, breakParent, softline } = prettier.doc.builders;

const printComment = (comment: JsonataComment): Doc => {
  return group(["/* ", comment.value, " */", hardline]);
};

const printBinaryNode: PrintNodeFunction<BinaryNode> = (node, path, options, printChildren) => {
  if (node.value === "..") {
    return group([printChildren("lhs"), indent([softline, node.value, printChildren("rhs")])]);
  }

  return group([printChildren("lhs"), indent([line, node.value, " ", printChildren("rhs")])]);
};

const printNameNode: PrintNodeFunction<NameNode> = (node, path, options, printChildren) => {
  return group([
    printEscapedNameNodeValue(node.value),
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printStages(node, path, options, printChildren),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printNumberNode: PrintNodeFunction<NumberNode> = (node, path, options, printChildren) => {
  return group([
    JSON.stringify(node.value),
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printStringNode: PrintNodeFunction<StringNode> = (node, path, options, printChildren) => {
  return group([
    JSON.stringify(node.value),
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printPathNode: PrintNodeFunction<PathNode> = (node, path, options, printChildren) => {
  const steps: Doc[] = node.steps.flatMap((step, idx) => {
    if (idx === 0) {
      return printChildren(["steps", idx]);
    }

    if (step.type === "sort") {
      return indent(["^", printChildren(["steps", idx])]);
    }

    return indent([softline, ".", printChildren(["steps", idx])]);
  });

  return group([...steps, printNodeGroup(node, path, options, printChildren)]);
};

type PrintFunctionNodeFunction = PrintNodeFunction<FunctionNode | PartialFunctionNode>;
const printFunctionNode: PrintFunctionNodeFunction = (node, path, options, printChildren) => {
  return group([
    printChildren("procedure"),
    "(",
    printFunctionArguments(node, path, options, printChildren),
    ")",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

type PrintFunctionArgumentsFunction = PrintNodeFunction<FunctionNode | PartialFunctionNode | LambdaNode>;
const printFunctionArguments: PrintFunctionArgumentsFunction = (node, path, options, printChildren) => {
  if (!node.arguments?.length) {
    return "";
  }

  if (node.arguments.length === 1) {
    return printChildren(["arguments", 0]);
  }

  const joinedArguments = join([",", line], path.map(printChildren, "arguments"));
  return [indent([softline, joinedArguments]), softline];
};

const printVariableNode: PrintNodeFunction<VariableNode> = (node, path, options, printChildren) => {
  return group([
    "$",
    node.value,
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
    printStages(node, path, options, printChildren),
  ]);
};

const printOperatorNode: PrintNodeFunction<OperatorNode> = (node) => {
  return node.value;
};

const printWildcardNode: PrintNodeFunction<WildcardNode> = (node) => {
  return node.value;
};

const printDescendantNode: PrintNodeFunction<DescendantNode> = (node) => {
  return node.value;
};

const printFilterNode: PrintNodeFunction<FilterNode> = (node, path, options, printChildren) => {
  return group(["[", indent([softline, printChildren("expr")]), softline, "]"]);
};

const printBindNode: PrintNodeFunction<BindNode> = (node, path, options, printChildren) => {
  return group([printChildren("lhs"), " ", node.value, " ", printChildren("rhs")]);
};

const printLambdaNode: PrintNodeFunction<LambdaNode> = (node, path, options, printChildren) => {
  if (node.thunk) {
    return printChildren("body");
  }

  return group([
    "function(",
    printFunctionArguments(node, path, options, printChildren),
    ") {",
    indent([line, printChildren("body")]),
    line,
    "}",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printConditionNode: PrintNodeFunction<ConditionNode> = (node, path, options, printChildren) => {
  const parentNode: JsonataASTNode | null = path.getParentNode();
  const isNestedCondition = parentNode?.type === "condition";
  const linebreak = isNestedCondition ? [hardline, breakParent] : line;

  return group([
    printChildren("condition"),
    indent([linebreak, "? ", printChildren("then")]),
    node.else ? indent([linebreak, ": ", printChildren("else")]) : "",
  ]);
};

const printValueNode: PrintNodeFunction<ValueNode> = (node, path, options, printChildren) => {
  return group([
    printValueNodeValue(node, path, options, printChildren),
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printValueNodeValue: PrintNodeFunction<ValueNode> = (node) => {
  if (node.value === null) return "null";
  if (node.value === false) return "false";
  if (node.value === true) return "true";

  return JSON.stringify(node.value);
};

const printBlockNode: PrintNodeFunction<BlockNode> = (node, path, options, printChildren) => {
  if (node.expressions.length === 0) {
    return group(["()", printPredicate(node, path, options, printChildren), printKeepArray(node)]);
  }

  if (node.expressions.length === 1) {
    return group([
      "(",
      printChildren(["expressions", 0]),
      ")",
      printNodeGroup(node, path, options, printChildren),
      printNodeFocus(node),
      printNodeIndex(node),
      printPredicate(node, path, options, printChildren),
      printKeepArray(node),
      printStages(node, path, options, printChildren),
    ]);
  }

  const joinedExpressions = join([";", hardline], path.map(printChildren, "expressions"));
  return group([
    "(",
    indent([hardline, joinedExpressions]),
    hardline,
    ")",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printApplyNode: PrintNodeFunction<ApplyNode> = (node, path, options, printChildren) => {
  return group([printChildren("lhs"), indent([line, node.value, " ", printChildren("rhs")])]);
};

const printSortNode: PrintNodeFunction<SortNode> = (node, path, options, printChildren) => {
  const sortTerms = node.terms.map((term, idx) => {
    return [printSortTermPrefix(term), printChildren(["terms", idx, "expression"])];
  });
  const joinedSortTerms = join([",", line], sortTerms);

  return group(["(", indent([softline, joinedSortTerms]), softline, ")"]);
};

const printSortTermPrefix = (sortTerm: SortNode["terms"][0]) => {
  return sortTerm.descending ? ">" : "<";
};

const printUnaryNode: PrintNodeFunction<UnaryNode> = (node, path, options, printChildren) => {
  if (node.value === "{") {
    return printObjectUnaryNode(node, path, options, printChildren);
  }

  if (node.value === "[") {
    return printArrayUnaryNode(node, path, options, printChildren);
  }

  if (node.value === "-") {
    return printNegationUnaryNode(node, path, options, printChildren);
  }

  throw new Error("Unhandled unary node " + (node as JsonataASTNode).value);
};

const printObjectUnaryNode: PrintNodeFunction<ObjectUnaryNode> = (node, path, options, printChildren) => {
  return group([
    "{",
    printUnaryTuplesForObjectUnaryNode(node, path, options, printChildren),
    "}",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printUnaryTuplesForObjectUnaryNode: PrintNodeFunction<ObjectUnaryNode> = (node, path, options, printChildren) => {
  if (node.lhs.length === 0) {
    return "";
  }

  const unaryTuples = node.lhs.map((tuple, idx) =>
    group([printChildren(["lhs", idx, 0]), ": ", printChildren(["lhs", idx, 1])]),
  );

  const hasNestedComplexUnaryNodeChildren = node.lhs.some((tuple) => isComplexUnaryNode(tuple[1]));
  const linebreak = hasNestedComplexUnaryNodeChildren ? [hardline, breakParent] : line;

  const joinedUnaryTuples = join([",", linebreak], unaryTuples);
  return [indent([linebreak, joinedUnaryTuples]), linebreak];
};

/**
 * Returns true, if the provided `node` argument represents an Unary Node
 * which could be considered complex ("negation" node is not considered context).
 *
 * This function can be used to decide which line break type to use based on AST tree complexity.
 */
const isComplexUnaryNode = (node: JsonataASTNode) => {
  if (node.type !== "unary") {
    return false;
  }

  if (node.value === "[") {
    return true;
  }

  if (node.value === "{") {
    return true;
  }
};

const printArrayUnaryNode: PrintNodeFunction<ArrayUnaryNode> = (node, path, options, printChildren) => {
  const joinedExpressions = join([",", line], path.map(printChildren, "expressions"));

  return group([
    "[",
    indent([softline, joinedExpressions]),
    softline,
    "]",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printNegationUnaryNode: PrintNodeFunction<NegationUnaryNode> = (node, path, options, printChildren) => {
  return group(["-", printChildren("expression")]);
};

const printParentNode: PrintNodeFunction<ParentNode> = (node, path, options, printChildren) => {
  return group([
    "%",
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
    printStages(node, path, options, printChildren),
  ]);
};

// https://github.com/jsonata-js/jsonata/blob/master/src/parser.js#L95
const supportedRegexFlags = ["i", "m"];

const printRegEx: PrintNodeFunction<RegexNode> = (node, path, options, printChildren) => {
  const flags = supportedRegexFlags.filter((flag) => node.value.flags.includes(flag)).join("");

  return group([
    `/${node.value.source}/${flags}`,
    printNodeGroup(node, path, options, printChildren),
    printNodeFocus(node),
    printNodeIndex(node),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printNodeFocus = (node: JsonataASTNode) => {
  if (!node.focus) {
    return "";
  }

  return "@$" + node.focus;
};

const printNodeIndex = (node: JsonataASTNode) => {
  if (!node.index) {
    return "";
  }

  return "#$" + node.index;
};

const printPredicate: PrintNodeFunction = (node, path, options, printChildren) => {
  if (!node.predicate) {
    return "";
  }

  return path.map(printChildren, "predicate");
};

const printStages: PrintNodeFunction<NameNode | VariableNode | ParentNode | BlockNode> = (
  node,
  path,
  options,
  printChildren,
) => {
  if (!node.stages) {
    return "";
  }

  return path.map(printChildren, "stages");
};

const printKeepArray = (node: JsonataASTNode) => {
  if (!node.keepArray) {
    return "";
  }
  return "[]";
};

const printNodeGroup: PrintNodeFunction = (node, path, options, printChildren) => {
  if (node.group === undefined) {
    return "";
  }

  if (node.group.lhs.length === 0) {
    return "{}";
  }

  const unaryTuples = node.group.lhs.map((tuple, idx) =>
    group([printChildren(["group", "lhs", idx, 0]), ": ", printChildren(["group", "lhs", idx, 1])]),
  );

  const hasNestedComplexUnaryNodeChildren = node.group.lhs.some((tuple) => isComplexUnaryNode(tuple[1]));
  const linebreak = hasNestedComplexUnaryNodeChildren ? [hardline, breakParent] : line;

  const joinedUnaryTuples = join([",", linebreak], unaryTuples);
  return group(["{", indent([linebreak, joinedUnaryTuples]), linebreak, "}"]);
};

const printEscapedNameNodeValue = (value: string): string => {
  if (value.startsWith("`") && value.endsWith("`")) {
    // If it's already wrapped in backticks - skip escaping logic below
    return value;
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    // If it's wrapped in double-quotes - rewrap in backticks for consistency
    return `\`${value.slice(1, -1)}\``;
  }

  /**
   * The RegExp was split into multiple ones to avoid unnecessary complexity.
   */
  const containsWhitespace = /\s/.test(value);
  if (containsWhitespace) {
    return `\`${value}\``;
  }

  const conflictsWithReservedWords = ["null", "false", "true"].includes(value);
  if (conflictsWithReservedWords) {
    return `\`${value}\``;
  }

  /**
   * ^ -> starts with
   * \d+ match 1 or more digits
   */
  const startsWithDigit = /^\d+/.test(value);
  if (startsWithDigit) {
    return `\`${value}\``;
  }

  /**
   * [^ -> match single character NOT present in
   * a-z -> lower case letters
   * A-Z -> upper case letters
   * _ -> underscore
   * [ -> the '[' symbol
   * \] -> the ']'
   * -> \d a digit. The case where the path starts with a digit is handled in the previous if statement
   * ] -> close the group
   */
  if (/[^a-zA-Z_[\]\d]/.test(value)) {
    return `\`${value}\``;
  }

  return value;
};
