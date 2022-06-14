import prettier from "prettier";
import { JsonataASTNode } from "../../types";
import { formatJsonata, serializeJsonata } from "..";
import jsonata from "jsonata";

describe(serializeJsonata, () => {
  beforeEach(prettier.clearConfigCache);

  test("can serialize jsonata AST to a formatted string", () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;
    const jsonataAST = jsonata(jsonataString).ast() as JsonataASTNode;

    const formattedJsonataString = serializeJsonata(jsonataAST);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("preserves backticks when serializing", () => {
    const jsonataString = "foo.`bar.0.baz`";
    const jsonataAST = jsonata(jsonataString).ast() as JsonataASTNode;

    const formattedJsonataString = serializeJsonata(jsonataAST);
    expect(formattedJsonataString).toEqual("foo.`bar.0.baz`");
  });

  test("clears prettier cache between operations and prevents context leaks between serialization attempts", () => {
    let jsonataAST = jsonata('$$.new.context.path.{ "key": "value" }').ast() as JsonataASTNode;
    let serializedJsonataAST = serializeJsonata(jsonataAST);

    expect(serializedJsonataAST).toEqual('$$.new.context.path.{ "key": "value" }');

    jsonataAST = jsonata("foo.bar.baz").ast() as JsonataASTNode;
    serializedJsonataAST = serializeJsonata(jsonataAST);

    /**
     * If the prettier cache was not cleared, the input from the previous serialization attempt would leak into the result.
     */
    expect(serializedJsonataAST).toEqual("foo.bar.baz");
  });
});

describe(formatJsonata, () => {
  beforeEach(prettier.clearConfigCache);

  test("can format jsonata string", () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;

    const formattedJsonataString = formatJsonata(jsonataString);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("clears prettier cache between operations and prevents context leaks between formatting attempts", () => {
    let formattedJsonataString = formatJsonata('$$.new.context.path.{ "key": "value" }');

    expect(formattedJsonataString).toEqual('$$.new.context.path.{ "key": "value" }');

    formattedJsonataString = formatJsonata("foo.bar.baz");
    /**
     * If the prettier cache was not cleared, the input from the previous formatting attempt would leak into the result.
     */
    expect(formattedJsonataString).toEqual("foo.bar.baz");
  });
});
