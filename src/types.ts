export interface Node {
  position: number;
  value: unknown;
  predicate?: JsonataASTNode[];
  keepArray?: boolean;
  focus?: string;
  index?: string;
  tuple?: true;
  group?: {
    lhs: UnaryTuple[];
  };
}

export interface NumberNode extends Node {
  type: "number";
  value: number;
}

export interface StringNode extends Node {
  type: "string";
  value: string;
}

export interface BinaryNode extends Node {
  type: "binary";
  lhs: JsonataASTNode;
  rhs: JsonataASTNode;
  value: BinaryValue;
}

export interface BindNode extends Node {
  type: "bind";
  value: ":=";
  lhs: VariableNode;
  rhs: JsonataASTNode;
}

type BinaryValue = "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "+" | "-" | "/" | "*" | "%" | "..";

export interface FunctionNode extends Node {
  type: "function";
  value: "(";
  arguments: JsonataASTNode[];
  procedure: VariableNode;
  stages?: JsonataASTNode[];
}

export interface PartialFunctionNode extends Node {
  type: "partial";
  value: "(";
  arguments: JsonataASTNode[];
  procedure: VariableNode;
  stages?: JsonataASTNode[];
}

export interface OperatorNode extends Node {
  type: "operator";
  value: "?";
}

export interface VariableNode extends Node {
  type: "variable";
  value: string;
  stages?: JsonataASTNode[];
}

export interface PathNode extends Node {
  type: "path";
  steps: JsonataASTNode[];
  keepSingletonArray?: boolean;
}

export interface BlockNode extends Node {
  type: "block";
  expressions: JsonataASTNode[];
  stages?: JsonataASTNode[];
}

export interface ApplyNode extends Node {
  type: "apply";
  value: "~>";
  lhs: JsonataASTNode;
  rhs: JsonataASTNode;
}

export interface SortNode extends Node {
  type: "sort";
  terms: [
    {
      descending: boolean;
      expression: JsonataASTNode;
    },
  ];
}

export type UnaryNode = ObjectUnaryNode | ArrayUnaryNode | NegationUnaryNode;

export interface ObjectUnaryNode extends Node {
  type: "unary";
  value: "{";
  lhs: UnaryTuple[];
}

export interface ArrayUnaryNode extends Node {
  type: "unary";
  value: "[";
  expressions: JsonataASTNode[];
  consarray: boolean;
}

export interface NegationUnaryNode extends Node {
  type: "unary";
  value: "-";
  expression: JsonataASTNode;
}

type UnaryTuple = [JsonataASTNode, JsonataASTNode];

export interface FilterNode extends Node {
  type: "filter";
  expr: JsonataASTNode;
}

export interface ValueNode extends Node {
  type: "value";
  value: true | false | null;
}

export type NullNode = Omit<ValueNode, "value"> & { value: null };

export interface NameNode extends Node {
  type: "name";
  value: string;
  stages?: JsonataASTNode[];
}

export interface WildcardNode extends Node {
  type: "wildcard";
  value: "*" | "**";
}
export interface DescendantNode extends Node {
  type: "descendant";
  value: string;
}

export interface ConditionNode extends Node {
  type: "condition";
  condition: JsonataASTNode;
  then: JsonataASTNode;
  else?: JsonataASTNode;
}

export interface LambdaNode extends Node {
  type: "lambda";
  arguments: JsonataASTNode[];
  body: JsonataASTNode;
  thunk?: boolean;
}

export interface ParentNode extends Node {
  type: "parent";
  slot: {
    label: string;
    level: number;
    index: number;
  };
  stages?: JsonataASTNode[];
}

export interface RegexNode extends Node {
  type: "regex";
  value: RegExp;
}

export interface TransformNode extends Node {
  type: "transform";
  pattern: JsonataASTNode;
  update: ObjectUnaryNode;
  delete?: ArrayUnaryNode;
}

export type LiteralNode = NumberNode | StringNode | ValueNode;

export type JsonataASTNode =
  | NumberNode
  | StringNode
  | ValueNode
  | BinaryNode
  | FunctionNode
  | PartialFunctionNode
  | OperatorNode
  | VariableNode
  | PathNode
  | BlockNode
  | ApplyNode
  | UnaryNode
  | FilterNode
  | NameNode
  | WildcardNode
  | DescendantNode
  | ConditionNode
  | BindNode
  | LambdaNode
  | SortNode
  | NullNode
  | ParentNode
  | RegexNode
  | TransformNode;

/**
 * Exported via the patch-package file.
 */
declare module "prettier/standalone" {
  function printDocToStringSync(doc: unknown, options: unknown): { formatted: string };
  function printAstToDocSync(ast: unknown, options: unknown): unknown;
  function printToDocSync(value: string, options: unknown): unknown;
}
