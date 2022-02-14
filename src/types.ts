export interface Node {
  position: number;
  value: unknown;
  predicate?: JsonataASTNode[];
  keepArray?: boolean;
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

type BinaryValue = "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "+" | "-" | "/" | "*" | "%";

export interface FunctionNode extends Node {
  type: "function";
  value: "(";
  arguments: JsonataASTNode[];
  procedure: VariableNode;
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

export type UnaryNode = ObjectUnaryNode | ArrayUnaryNode;

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

type UnaryTuple = [JsonataASTNode, JsonataASTNode];

export interface FilterNode extends Node {
  type: "filter";
  expr: JsonataASTNode;
}

export interface ValueNode extends Node {
  type: "value";
  value: true | false | null;
}

export interface NameNode extends Node {
  type: "name";
  value: string;
  stages?: JsonataASTNode[];
  focus?: string;
  index?: string;
  tuple?: true;
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

export type LiteralNode = NumberNode | StringNode | ValueNode;

export type JsonataASTNode =
  | NumberNode
  | StringNode
  | ValueNode
  | BinaryNode
  | FunctionNode
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
  | SortNode;
