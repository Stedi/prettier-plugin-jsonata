import {
  JsonataASTNode,
  ObjectUnaryNode,
  ArrayUnaryNode,
  StringNode,
  NullNode,
  NumberNode,
  LiteralNode,
  FunctionNode,
  PartialFunctionNode,
  SortNode,
  NegationUnaryNode,
  NameNode,
  LambdaNode,
  ParentNode,
  FilterNode,
  VariableNode,
  ConditionNode,
  BinaryNode,
  BindNode,
  ValueNode,
  OperatorNode,
  PathNode,
  BlockNode,
  ApplyNode,
  WildcardNode,
  UnaryNode,
  DescendantNode,
  RegexNode,
} from "./types";

// test

/**
 * Checks whether the node represents AST that evaluates to an object.
 * For example, `{"foo": "bar"}` expression would evaluate to AST that fulfills checks within this function.
 *
 * The `isObjectUnaryNode` only checks the underlying structure, and the number of properties or types of values is of no concern for this function.
 */
export const isObjectUnaryNode = (node: JsonataASTNode): node is ObjectUnaryNode => {
  if (node.type !== "unary") {
    return false;
  }

  if (node.value !== "{") {
    return false;
  }

  return true;
};

export const isOperatorNode = (node: JsonataASTNode): node is OperatorNode => {
  if (node.type !== "operator") {
    return false;
  }

  return node.value === "?";
};

/**
 * Checks whether the node represents and AST that evaluates an array.
 * For example, `[{property: "value"}, {property: "otherValue"}]`, `[1, true, "string"]`, and `[]` expressions would evaluate to AST that fulfills checks within this function.
 */
export const isArrayUnaryNode = (node: JsonataASTNode): node is ArrayUnaryNode => {
  if (node.type !== "unary") {
    return false;
  }

  if (node.value !== "[") {
    return false;
  }

  return true;
};

export const isValueNode = (node: JsonataASTNode): node is ValueNode => {
  if (node.type !== "value") {
    return false;
  }

  const allowedValues = [true, false, null];
  return allowedValues.includes(node.value);
};

export const isStringNode = (node: JsonataASTNode): node is StringNode => {
  return node.type === "string";
};

export const isNullNode = (node: JsonataASTNode): node is NullNode => {
  return node.value == null && node.type === "value";
};

export const isNumberNode = (node: JsonataASTNode): node is NumberNode => {
  return node.type === "number";
};

/**
 * Checks whether the node represents an AST that evaluates to a primitive node.
 * For example, the `true`, `"hello"` or `1` would all evaluate to AST that fullfil checks within this function.
 */
export const isPrimitiveNode = (node: JsonataASTNode): node is LiteralNode => {
  return ["string", "number", "value"].includes(node.type);
};

/**
 * Checks whether the node represents an AST that evaluates to a JSONata function.
 * For example, the `$length("hi")` would evaluate to AST that fullfil checks within this function.
 */
export const isFunctionNode = (node: JsonataASTNode): node is FunctionNode => {
  if (node.type !== "function") {
    return false;
  }

  if (node.value !== "(") {
    return false;
  }

  return true;
};

/**
 * Checks whether the node represents an AST that evaluates to a partially applied function.
 * For example, the `$substring(?, 0, 5)` would evaluate to AST that fullfil checks within this function.
 *
 * Please note, that the partial function has to be declared within a block.
 * More info here: https://docs.jsonata.org/programming#partial-function-application
 */
export const isPartialFunctionNode = (node: JsonataASTNode): node is PartialFunctionNode => {
  if (node.type !== "partial") {
    return false;
  }

  if (node.value !== "(") {
    return false;
  }

  return true;
};

/**
 * Checks whether the node represents an AST that evaluates to a `^` symbol in the context of path operators.
 * For example, given the `Product^(Price)` expression, the `^` symbol would evaluate to AST that fullfil checks within this function.
 *
 * More info here: https://docs.jsonata.org/path-operators#---order-by
 */
export const isSortNode = (node: JsonataASTNode): node is SortNode => {
  return node.type === "sort";
};

export const isNegationNode = (node: JsonataASTNode): node is NegationUnaryNode => {
  if (node.type !== "unary") {
    return false;
  }

  if (node.value !== "-") {
    return false;
  }

  return true;
};

/**
 * Checks whether the node represents an AST that evaluates to a key in key:value structure.
 * For example, given the `{foo: "bar"}` expression, the `foo:` would evaluate to AST that fullfil checks within this function.
 */
export const isNameNode = (node: JsonataASTNode): node is NameNode => {
  return node.type === "name";
};

/**
 * Checks whether the node represents an AST that evaluates to a antonymous function declaration.
 * For example, the `function($a, $b){$a + $b}` expression would evaluate to AST that fullfil checks within this function.
 */
export const isLambdaNode = (node: JsonataASTNode): node is LambdaNode => {
  return node.type === "lambda";
};

/**
 * Checks whether the node represents an AST that evaluates to a "%" symbol in the context of path operations.
 * For example, given the `MyParent.{'OrderID': %.OrderId}` expression, the `%` would evaluate to AST that fullfil checks within this function.
 */
export const isParentNode = (node: JsonataASTNode): node is ParentNode => {
  return node.type === "parent";
};

/**
 * Checks whether the node represents an AST that evaluates to a filter expression predicate.
 * For example, given the `Phone[type='mobile']` expression, the `type='mobile'` would evaluate to AST that fullfil checks within this function.
 *
 * More info here: https://docs.jsonata.org/path-operators#---order-by
 */
export const isFilterNode = (node: JsonataASTNode): node is FilterNode => {
  return node.type === "filter";
};

/**
 * Checks whether the node represents an AST that evaluates to a variable.
 * For example, given the `$foo := "bar"` expression, the `$foo` would evaluate to AST that fullfil checks within this function.
 */
export const isVariableNode = (node: JsonataASTNode): node is VariableNode => {
  return node.type === "variable";
};

/**
 * Checks whether the node represents an AST that evaluates to a JSONata condition.
 * For example, the `property = 3 ? "three": "not three"` would evaluate to AST that fullfil checks within this function.
 */
export const isConditionNode = (node: JsonataASTNode): node is ConditionNode => {
  return node.type === "condition";
};

/**
 * Checks whether the node represents an AST that evaluates to a JSONata `&` expression.
 * For example, the `"foo" & "bar"` would evaluate to AST that fullfil checks within this function.
 */
export const isBinaryNode = (node: JsonataASTNode): node is BinaryNode => {
  return node.type === "binary";
};

/**
 * Checks whether the node represents an AST that evaluates to JSONata property assignment expression.
 * For example, the `$myVar := "value"` would evaluate to AST that fullfil checks within this function.
 */
export const isBindNode = (node: JsonataASTNode): node is BindNode => {
  return node.type === "bind";
};

export const isPathNode = (node: JsonataASTNode): node is PathNode => {
  if (node.type !== "path") {
    return false;
  }

  return Array.isArray(node.steps);
};

export const isBlockNode = (node: JsonataASTNode): node is BlockNode => {
  if (node.type !== "block") {
    return false;
  }

  return Array.isArray(node.expressions);
};

/**
 * Checks whether the node represents an AST that evaluates to a `~>` symbol in the context of function chaining.
 * For example, given the `"foo" ~> $uppercase ~> $trim` expression, the `~>` symbol would evaluate to AST that fullfil checks within this function.
 *
 * More info here: https://docs.jsonata.org/other-operators#-chain
 */
export const isApplyNode = (node: JsonataASTNode): node is ApplyNode => {
  if (node.type !== "apply") {
    return false;
  }

  if (node.value !== "~>") {
    return false;
  }

  return true;
};

export const isUnaryNode = (node: JsonataASTNode): node is UnaryNode => {
  if (node.type !== "unary") {
    return false;
  }

  const allowedValues = ["{", "[", "-"];
  return allowedValues.includes(node.value);
};

export const isWildcardNode = (node: JsonataASTNode): node is WildcardNode => {
  if (node.type !== "wildcard") {
    return false;
  }

  const allowedValues = ["*", "**"];
  return allowedValues.includes(node.value);
};

export const isDescendantNode = (node: JsonataASTNode): node is DescendantNode => {
  if (node.type !== "descendant") {
    return false;
  }

  return typeof node.value === "string";
};

export const isRegexNode = (node: JsonataASTNode): node is RegexNode => {
  if (node.type !== "regex") {
    return false;
  }

  return true;
};
