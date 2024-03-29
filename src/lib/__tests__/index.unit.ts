import { JsonataASTNode } from "../../types";
import { formatJsonata, formatJsonataSync, serializeJsonata, serializeJsonataSync } from "..";
import jsonata from "jsonata";

describe(serializeJsonata, () => {
  test("can sync serialize jsonata AST to a formatted string", async () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;
    const jsonataAST = jsonata(jsonataString).ast() as JsonataASTNode;

    const formattedJsonataString = serializeJsonataSync(jsonataAST);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("can serialize jsonata AST to a formatted string", async () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;
    const jsonataAST = jsonata(jsonataString).ast() as JsonataASTNode;

    const formattedJsonataString = await serializeJsonata(jsonataAST);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("preserves backticks when serializing", async () => {
    const jsonataString = "foo.`bar.0.baz`";
    const jsonataAST = jsonata(jsonataString).ast() as JsonataASTNode;

    const formattedJsonataString = await serializeJsonata(jsonataAST);
    expect(formattedJsonataString).toEqual("foo.`bar.0.baz`");
  });

  test("clears prettier cache between operations and prevents context leaks between serialization attempts", async () => {
    let jsonataAST = jsonata('$$.new.context.path.{ "key": "value" }').ast() as JsonataASTNode;
    let serializedJsonataAST = await serializeJsonata(jsonataAST);

    expect(serializedJsonataAST).toEqual('$$.new.context.path.{ "key": "value" }');

    jsonataAST = jsonata("foo.bar.baz").ast() as JsonataASTNode;
    serializedJsonataAST = await serializeJsonata(jsonataAST);

    /**
     * If the prettier cache was not cleared, the input from the previous serialization attempt would leak into the result.
     */
    expect(serializedJsonataAST).toEqual("foo.bar.baz");
  });
});

describe(formatJsonata, () => {
  test("can sync format jsonata string", async () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;

    const formattedJsonataString = formatJsonataSync(jsonataString);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("can format jsonata string", async () => {
    const jsonataString = `($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")`;

    const formattedJsonataString = await formatJsonata(jsonataString);

    expect(formattedJsonataString).toBe(`(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)`);
  });

  test("clears prettier cache between operations and prevents context leaks between formatting attempts", async () => {
    let formattedJsonataString = await formatJsonata('$$.new.context.path.{ "key": "value" }');

    expect(formattedJsonataString).toEqual('$$.new.context.path.{ "key": "value" }');

    formattedJsonataString = await formatJsonata("foo.bar.baz");
    /**
     * If the prettier cache was not cleared, the input from the previous formatting attempt would leak into the result.
     */
    expect(formattedJsonataString).toEqual("foo.bar.baz");
  });
});
