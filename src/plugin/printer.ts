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
} from "../types";
import * as prettier from "prettier";
import type { AstPath, Doc, Options, Printer } from "prettier";

// We have to redefine this type, because @types/prettier contain incorrect (reduced) version
// of the type of the 3rd argument for Printer["print"]
type PrintChildrenFunction = (selector?: string | number | Array<string | number> | AstPath) => Doc;

export const print: Printer["print"] = (path, options, printChildren) => {
  const node: JsonataASTNode = path.getValue();
  const commonPrintArgs = [path, options, printChildren as PrintChildrenFunction] as const;

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

const printBinaryNode: PrintNodeFunction<BinaryNode> = (node, path, options, printChildren) => {
  return group([printChildren("lhs"), indent([line, node.value, " ", printChildren("rhs")])]);
};

const printNameNode: PrintNodeFunction<NameNode> = (node, path, options, printChildren) => {
  return group([
    printEscapedNameNodeValue(node.value),
    printNameNodeFocus(node),
    printNameNodeIndex(node),
    printStages(node, path, options, printChildren),
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printEscapedNameNodeValue = (name: string) => {
  const containsWhitespace = /\s/.test(name);
  const conflictsWithReservedWords = ["null", "false", "true"].includes(name);
  const startsWithNumber = /^\d/.test(name);
  const containsUnsafeChars = /^[a-zA-Z\d()._]+$/.test(name) === false;

  if (containsWhitespace || conflictsWithReservedWords || startsWithNumber || containsUnsafeChars) {
    return "`" + name + "`";
  }

  return name;
};

const printNameNodeFocus = (node: NameNode) => {
  if (!node.focus) {
    return "";
  }

  return "@$" + node.focus;
};

const printNameNodeIndex = (node: NameNode) => {
  if (!node.index) {
    return "";
  }

  return "#$" + node.index;
};

const printNumberNode: PrintNodeFunction<NumberNode> = (node, path, options, printChildren) => {
  return group([JSON.stringify(node.value), printPredicate(node, path, options, printChildren), printKeepArray(node)]);
};

const printStringNode: PrintNodeFunction<StringNode> = (node, path, options, printChildren) => {
  return group([JSON.stringify(node.value), printPredicate(node, path, options, printChildren), printKeepArray(node)]);
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

  return group(steps);
};

type PrintFunctionNodeFunction = PrintNodeFunction<FunctionNode | PartialFunctionNode>;
const printFunctionNode: PrintFunctionNodeFunction = (node, path, options, printChildren) => {
  return group([
    printChildren("procedure"),
    "(",
    printFunctionArguments(node, path, options, printChildren),
    ")",
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

type PrintFunctionArgumentsFunction = PrintNodeFunction<FunctionNode | PartialFunctionNode | LambdaNode>;
const printFunctionArguments: PrintFunctionArgumentsFunction = (node, path, options, printChildren) => {
  if (!node.arguments?.length) {
    return "";
  }

  const joinedArguments = join([",", line], path.map(printChildren, "arguments"));

  return [indent([softline, joinedArguments]), softline];
};

const printVariableNode: PrintNodeFunction<VariableNode> = (node, path, options, printChildren) => {
  return group([
    "$",
    node.value,
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
  const joinedExpressions = join([";", hardline], path.map(printChildren, "expressions"));

  return group([
    "(",
    indent([hardline, joinedExpressions]),
    hardline,
    ")",
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

  throw new Error("Unhandled unary node " + (node as JsonataASTNode).value);
};

const printObjectUnaryNode: PrintNodeFunction<ObjectUnaryNode> = (node, path, options, printChildren) => {
  return group([
    "{",
    printUnaryTuplesForObjectUnaryNode(node, path, options, printChildren),
    "}",
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

  const hasNestedUnaryChildren = node.lhs.some((tuple) => tuple[1].type === "unary");
  const linebreak = hasNestedUnaryChildren ? [hardline, breakParent] : line;

  const joinedUnaryTuples = join([",", linebreak], unaryTuples);
  return [indent([linebreak, joinedUnaryTuples]), linebreak];
};

const printArrayUnaryNode: PrintNodeFunction<ArrayUnaryNode> = (node, path, options, printChildren) => {
  const joinedExpressions = join([",", line], path.map(printChildren, "expressions"));

  return group([
    "[",
    indent([softline, joinedExpressions]),
    softline,
    "]",
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
  ]);
};

const printParentNode: PrintNodeFunction<ParentNode> = (node, path, options, printChildren) => {
  return group([
    "%",
    printPredicate(node, path, options, printChildren),
    printKeepArray(node),
    printStages(node, path, options, printChildren),
  ]);
};

const printPredicate: PrintNodeFunction = (node, path, options, printChildren) => {
  if (!node.predicate) {
    return "";
  }

  return path.map(printChildren, "predicate");
};

const printStages: PrintNodeFunction<NameNode | VariableNode | ParentNode> = (node, path, options, printChildren) => {
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
