import jsonata from "jsonata";
import { isConditionNode, isFunctionNode, isObjectUnaryNode, isPrimitiveNode } from "../node";
import { JsonataASTNode } from "../types";

describe("isObjectUnaryNode", () => {
  it("returns false for a number node", () => {
    const astNode = jsonata("4").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a string node", () => {
    const astNode = jsonata("'wojtek'").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a string node with explicit value of 'undefined'", () => {
    const astNode = jsonata("'undefined'").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a node which value is null", () => {
    const astNode = jsonata("null").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a flat array node", () => {
    const astNode = jsonata("[1,undefined,3]").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a nested array node", () => {
    const astNode = jsonata("[[1,2,3], [4,5,6], [7,8,undefined]]").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for a array-of-objects node", () => {
    const astNode = jsonata('[{"foo": "bar"}, {"bar": undefined}]').ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns true for an empty object node", () => {
    const astNode = jsonata("{}").ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeTrue();
  });

  it("returns true for a flat object node", () => {
    const astNode = jsonata('{"foo":"bar"}').ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeTrue();
  });

  it("returns true for a nested object node", () => {
    const astNode = jsonata('{"foo":{"bar": undefined, "baz": "foo"}}').ast() as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeTrue();
  });

  it("returns false for non iterable lhs", () => {
    const astNode = {
      type: "unary",
      value: "{",
      lhs: "foo" as unknown,
      position: 1,
    } as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns false for non iterable lhs tuples", () => {
    const astNode = {
      type: "unary",
      value: "{",
      lhs: ["foo", "bar"] as unknown,
      position: 1,
    } as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeFalse();
  });

  it("returns true for iterable lhs tuples", () => {
    const astNode = {
      type: "unary",
      value: "{",
      lhs: [
        [
          { type: "string", value: "foo", position: 1 },
          { type: "string", value: "bar", position: 1 },
        ],
      ],
      position: 1,
    } as JsonataASTNode;
    expect(isObjectUnaryNode(astNode)).toBeTrue();
  });
});

describe("isPrimitiveNode", () => {
  test("returns false for an object node", () => {
    const objectNode = jsonata(`{}`).ast() as JsonataASTNode;

    expect(isPrimitiveNode(objectNode)).toEqual(false);
  });

  test("returns false for an array node", () => {
    const arrayNode = jsonata(`[1,2]`).ast() as JsonataASTNode;

    expect(isPrimitiveNode(arrayNode)).toEqual(false);
  });

  test("returns true for a primitive string node", () => {
    const primitiveStringNode = jsonata(`"hello"`).ast() as JsonataASTNode;

    expect(isPrimitiveNode(primitiveStringNode)).toEqual(true);
  });

  test("returns true for a primitive number node", () => {
    const primitiveNumberNode = jsonata(`1`).ast() as JsonataASTNode;

    expect(isPrimitiveNode(primitiveNumberNode)).toEqual(true);
  });

  test("returns true for a primitive boolean node", () => {
    const primitiveBooleanNode = jsonata(`true`).ast() as JsonataASTNode;

    expect(isPrimitiveNode(primitiveBooleanNode)).toEqual(true);
  });
});

describe("isFunctionNode", () => {
  test("returns false for an object node", () => {
    const emptyObjectNode = jsonata(`{}`).ast() as JsonataASTNode;

    expect(isFunctionNode(emptyObjectNode)).toEqual(false);

    const notEmptyObjectNode = jsonata(`{"a": 1}`).ast() as JsonataASTNode;

    expect(isFunctionNode(notEmptyObjectNode)).toEqual(false);
  });

  test("returns false for an array node", () => {
    const filledArrayNode = jsonata(`[1,2]`).ast() as JsonataASTNode;

    expect(isFunctionNode(filledArrayNode)).toEqual(false);

    const emptyArrayNode = jsonata(`[]`).ast() as JsonataASTNode;

    expect(isFunctionNode(emptyArrayNode)).toEqual(false);
  });

  test("returns false for a primitive string node", () => {
    const primitiveStringNode = jsonata(`"hello"`).ast() as JsonataASTNode;

    expect(isFunctionNode(primitiveStringNode)).toEqual(false);
  });

  test("returns false for a primitive number node", () => {
    const primitiveNumberNode = jsonata(`1`).ast() as JsonataASTNode;

    expect(isFunctionNode(primitiveNumberNode)).toEqual(false);
  });

  test("returns false for a primitive boolean node", () => {
    const primitiveBooleanNode = jsonata(`true`).ast() as JsonataASTNode;

    expect(isFunctionNode(primitiveBooleanNode)).toEqual(false);
  });

  test("returns false for a path node", () => {
    const pathNode = jsonata(`"foo".bar[0]`).ast() as JsonataASTNode;

    expect(isFunctionNode(pathNode)).toEqual(false);
  });

  test("returns true for a function node", () => {
    const simpleFunctionNode = jsonata(`$sum([1,2,3])`).ast() as JsonataASTNode;

    expect(isFunctionNode(simpleFunctionNode)).toEqual(true);

    const complexFunctionNode = jsonata(`$sum([$sum([1,2,3]),$sum([4,5,6])])`).ast() as JsonataASTNode;

    expect(isFunctionNode(complexFunctionNode)).toEqual(true);
  });
});

describe("isConditionNode", () => {
  test("returns false for an object node", () => {
    const emptyObjectNode = jsonata(`{}`).ast() as JsonataASTNode;

    expect(isConditionNode(emptyObjectNode)).toEqual(false);

    const notEmptyObjectNode = jsonata(`{"a": 1}`).ast() as JsonataASTNode;

    expect(isConditionNode(notEmptyObjectNode)).toEqual(false);
  });

  test("returns false for an array node", () => {
    const filledArrayNode = jsonata(`[1,2]`).ast() as JsonataASTNode;

    expect(isConditionNode(filledArrayNode)).toEqual(false);

    const emptyArrayNode = jsonata(`[]`).ast() as JsonataASTNode;

    expect(isConditionNode(emptyArrayNode)).toEqual(false);
  });

  test("returns false for a primitive string node", () => {
    const primitiveStringNode = jsonata(`"hello"`).ast() as JsonataASTNode;

    expect(isConditionNode(primitiveStringNode)).toEqual(false);
  });

  test("returns false for a primitive number node", () => {
    const primitiveNumberNode = jsonata(`1`).ast() as JsonataASTNode;

    expect(isConditionNode(primitiveNumberNode)).toEqual(false);
  });

  test("returns false for a primitive boolean node", () => {
    const primitiveBooleanNode = jsonata(`true`).ast() as JsonataASTNode;

    expect(isConditionNode(primitiveBooleanNode)).toEqual(false);
  });

  test("returns false for a path node", () => {
    const pathNode = jsonata(`"foo".bar[0]`).ast() as JsonataASTNode;

    expect(isConditionNode(pathNode)).toEqual(false);
  });

  test("returns false for a function node", () => {
    const simpleFunctionNode = jsonata(`$sum([1,2,3])`).ast() as JsonataASTNode;

    expect(isConditionNode(simpleFunctionNode)).toEqual(false);

    const complexFunctionNode = jsonata(`$sum([$sum([1,2,3]),$sum([4,5,6])])`).ast() as JsonataASTNode;

    expect(isConditionNode(complexFunctionNode)).toEqual(false);
  });

  test("returns true for a condition node", () => {
    const simpleConditionNode = jsonata('property = 3 ? "three"').ast() as JsonataASTNode;

    expect(isConditionNode(simpleConditionNode)).toEqual(true);

    const complexConditionNode = jsonata('property = 3 ? "three" : "four"').ast() as JsonataASTNode;

    expect(isConditionNode(complexConditionNode)).toEqual(true);
  });
});
