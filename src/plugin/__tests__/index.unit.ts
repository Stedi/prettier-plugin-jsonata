import * as prettierPlugin from "..";
import * as prettier from "prettier";
import jsonata from "jsonata";

describe("prettierPlugin", () => {
  const format = (input: string, options?: prettier.Options) => {
    const formatted = prettier.format(input, {
      parser: prettierPlugin.AST_PARSER_NAME,
      plugins: [prettierPlugin],
      printWidth: 150,
      tabWidth: 2,
      useTabs: false,
      ...options,
    });

    // always validating that the result of formatting is backward compatible with JSONata
    expect(() => jsonata(formatted).ast()).not.toThrow();
    return formatted;
  };

  test("re-throws JsonataError on invalid JSONata statement", () => {
    expect(() => format("+$foo")).toThrow(
      'Error: The symbol "+" cannot be used as a unary operator, code: S0211, position: 1, token: +',
    );
  });

  // these were adopted from jsonata-ui-core lib
  test.each([
    ["expr"],
    ["foo"],
    ['"foo"'],
    ["true"],
    ["false"],
    ["1"],
    ["1.1"],
    ["-1"],
    ["-1.1"],
    ["{}"],
    ['{ "foo": "bar" }'],
    ["[]"],
    ["[1..10]"],
    ["[1..$n]"],
    ['["foo", "bar"]'],
    ["-foo"],
    ["foo = 1"],
    ["foo.bar"],
    ["foo.bar{}"],
    ["foo.bar{ baz: boo }"],
    ["foo[bar = 1]"],
    ["foo[0]"],
    ["$"],
    ["$.foo"],
    ["$$"],
    ["$$.foo"],
    ["${ k: v }"],
    ["$${ k: v }"],
    ["$foo"],
    ["-$foo"],
    ["$foo()"],
    ["-$foo()"],
    ["$foo(1)"],
    ["$foo(1, 2)"],
    ["$foo(?, 2)"],
    ["*"],
    ["*.foo"],
    ["**"],
    ["**.foo"],
    ["foo ~> $max()"],
    ["foo^(<bar)"],
    ["loans@$foo#$bar"],
    ["loans@$foo"],
    ["loans#$bar"],
    ["(loans)#$bar"],
    ["(loans)@$bar"],
    ["(loans)@$foo#$bar"],
    ["$$@$foo#$bar"],
    ["$$@$foo"],
    ["$$#$bar"],
    ["$foo()@$foo#$bar"],
    ["$foo()@$foo"],
    ["$foo()#$bar"],
    ["foo - bar"],
    ["foo + bar"],
    ["foo / bar"],
    ["foo * bar"],
    ["foo + -bar"],
    ["`😊`"],
    ['"foo-bar"'],
    ['"foo+bar"'],
    ['"foo/bar"'],
    ['"foo*bar"'],
    ['"foo-bar"'],
    ['"foo+bar"'],
    ['"foo/bar"'],
    ['"foo*bar"'],
    ['"\\""'],
    ["foo_bar"],
    ["foo1bar"],
    ["foobar1"],
    ["foobar_1"],
    ["`1foobar`"],
    ["`foo-bar`"],
    ["`foo+bar`"],
    ["`foo/bar`"],
    ["`foo*bar`"],
    ["`foo.0.bar`"],
    ["`foobar-1`"],
    ["foo.bar.baz"],
    ["foo.foo_bar"],
    ["foo[]"],
    ["foo.{ bar: % }"],
    ['foo.{ bar: "baz", boo: "bee" }[]'],
    ["$foo[]"],
    ["[1, 2, 3][]"],
    ['false ? ["a", "b"] : ["c"]'],
    ["$filter([1, 2, 3], function($v) { true })[]"],
    ["$sum($map(foo, function($v) { $number($v.bar) }))"],
    ['$split("1,2,3", ",")[1]'],
    ['["foo", "bar"][0]'],
    ["$number(number_of_units_shipped_05)"],
    ["/g(oog)+le/"],
    ["/\\d{5}(-\\d{4})?/i"],
    ["/[2-9]|[12]\\d|3[0-6]/m"],
    ["/(\\w+)\\s(\\w+)/im"],
  ])("can format simple %p example without changes", (input) => {
    const formatted = format(input);
    expect(formatted).toEqual(input);
  });

  test("formats blocks with new lines", () => {
    let formatted = format(`()`);
    expect(formatted).toMatchInlineSnapshot(`"()"`);

    formatted = format(`(foo)`);
    expect(formatted).toMatchInlineSnapshot(`"(foo)"`);

    formatted = format(`(foo;bar;baz)`);
    expect(formatted).toMatchInlineSnapshot(`
      "(
        foo;
        bar;
        baz
      )"
    `);

    formatted = format(`(false ? ["foo", "bar"] : ["baz"])`);
    expect(formatted).toMatchInlineSnapshot(`"(false ? [\\"foo\\", \\"bar\\"] : [\\"baz\\"])"`);

    formatted = format(`(false ? ["foo", "bar"] : ["baz"]; boo)`);
    expect(formatted).toMatchInlineSnapshot(`
      "(
        false ? [\\"foo\\", \\"bar\\"] : [\\"baz\\"];
        boo
      )"
    `);
  });

  test("handles line breaks for functions with more than one argument on print width overflow", () => {
    let formatted = format(`longFunctionName()`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`"longFunctionName()"`);

    formatted = format(`longFunctionName($withArgument)`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`"longFunctionName($withArgument)"`);

    formatted = format(`longFunctionName($withArgument, $withAnotherArgument)`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`
      "longFunctionName(
        $withArgument,
        $withAnotherArgument
      )"
    `);
  });

  test("handles line breaks for lambdas on print width overflow", () => {
    let formatted = format(`function () { true }`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`
    "function() {
      true
    }"
  `);

    formatted = format(`function ($withArgument) { true }`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`
      "function($withArgument) {
        true
      }"
    `);

    formatted = format(`function ($withArgument, $withAnotherArgument) { true }`, { printWidth: 10 });
    expect(formatted).toMatchInlineSnapshot(`
      "function(
        $withArgument,
        $withAnotherArgument
      ) {
        true
      }"
    `);

    formatted = format(
      `function ($withArgument, $withAnotherArgument) {( $foo := $withArgument + $withAnotherArgument; $foo )}`,
      { printWidth: 10 },
    );
    expect(formatted).toMatchInlineSnapshot(`
      "function(
        $withArgument,
        $withAnotherArgument
      ) {
        (
          $foo := $withArgument
            + $withAnotherArgument;
          $foo
        )
      }"
    `);
  });

  test("handles line breaks for objects on print width overflow", () => {
    let formatted = format(`{"foo": "bar"}`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": \\"bar\\" }"`);

    formatted = format(`{"foo": "bar", "baz": "boo"}`, { printWidth: 40 });
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": \\"bar\\", \\"baz\\": \\"boo\\" }"`);

    formatted = format(`{"foo": "bar", "baz": "boo"}`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": \\"bar\\",
        \\"baz\\": \\"boo\\"
      }"
    `);

    formatted = format(`{"foo": "bar","longerKey": "longerValue"}`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": \\"bar\\",
        \\"longerKey\\": \\"longerValue\\"
      }"
    `);
  });

  test("always breaks objects with nested children which are of object or array type", () => {
    let formatted = format(`{"foo": {"bar": "baz"}, "boo": "bee"}`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": { \\"bar\\": \\"baz\\" },
        \\"boo\\": \\"bee\\"
      }"
    `);

    formatted = format(`{"foo": {"bar": {"baz": "boo"}}, "bee": "fee"}`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": {
          \\"bar\\": { \\"baz\\": \\"boo\\" }
        },
        \\"bee\\": \\"fee\\"
      }"
    `);

    formatted = format(`{"foo": ["bar", "baz"], "boo": "bee"}`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": [\\"bar\\", \\"baz\\"],
        \\"boo\\": \\"bee\\"
      }"
    `);

    formatted = format(`{"foo": {"bar": ["baz", "boo"]}, "bee": "fee"}`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "{
        \\"foo\\": {
          \\"bar\\": [\\"baz\\", \\"boo\\"]
        },
        \\"bee\\": \\"fee\\"
      }"
    `);
  });

  test("handles line breaks for arrays on print width overflow", () => {
    let formatted = format(`["foo","bar"]`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"[\\"foo\\", \\"bar\\"]"`);

    formatted = format(`["foo", "bar", "baz", "boo"]`, { printWidth: 40 });
    expect(formatted).toMatchInlineSnapshot(`"[\\"foo\\", \\"bar\\", \\"baz\\", \\"boo\\"]"`);

    formatted = format(`["foo", "bar", "baz", "boo"]`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "[
        \\"foo\\",
        \\"bar\\",
        \\"baz\\",
        \\"boo\\"
      ]"
    `);
  });

  test("handles line breaks for ternary conditions on print width overflow", () => {
    let formatted = format(`foo ? bar : baz`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo ? bar : baz"`);

    formatted = format(`foo ? bar : longerValue`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        ? bar
        : longerValue"
    `);
  });

  test("always inserts line breaks for nested ternary conditions", () => {
    let formatted = format(`foo ? bar : baz ? boo : bee`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        ? bar
        : baz
          ? boo
          : bee"
    `);

    formatted = format(`foo ? bar ? baz : boo : bee`, { printWidth: 200 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        ? bar
          ? baz
          : boo
        : bee"
    `);
  });

  test("handles line breaks for binary nodes on print width overflow", () => {
    let formatted = format(`foo+bar`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo + bar"`);

    formatted = format(`longerValue+anotherLongerValue`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "longerValue
        + anotherLongerValue"
    `);
  });

  test("handles line breaks for apply nodes on print width overflow", () => {
    let formatted = format(`foo~>bar`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo ~> bar"`);

    formatted = format(`longerValue~>anotherLongerValue`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "longerValue
        ~> anotherLongerValue"
    `);
  });

  test("avoids line breaks for bind nodes on print width overflow", () => {
    let formatted = format(`$foo:=bar`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"$foo := bar"`);

    formatted = format(`$longerVarName:=longerValue`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"$longerVarName := longerValue"`);

    formatted = format(`$longerVarName:=longer.path.to.value`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "$longerVarName := longer
        .path
        .to
        .value"
    `);
  });

  test("handles line breaks for filter nodes on print width overflow", () => {
    let formatted = format(`foo.bar[a=b]`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo.bar[a = b]"`);

    formatted = format(`foo.bar[longerKey=longerValue]`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        .bar[
          longerKey
            = longerValue
        ]"
    `);
  });

  test("handles line breaks for sort nodes on print width overflow", () => {
    let formatted = format(`foo.bar^(<c)`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo.bar^(<c)"`);

    formatted = format(`foo.bar^(<longerSortKey)`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        .bar^(
          <longerSortKey
        )"
    `);

    formatted = format(`foo.bar^(<firstSortKey,>secondSortKey)`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        .bar^(
          <firstSortKey,
          >secondSortKey
        )"
    `);
  });

  test("handles line breaks for path nodes on print width overflow", () => {
    let formatted = format(`foo.bar.baz`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`"foo.bar.baz"`);

    formatted = format(`foo.bar.baz.longerSegment`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        .bar
        .baz
        .longerSegment"
    `);

    formatted = format(`foo.bar[a = b].baz^(<c,>d).longerSegment`, { printWidth: 20 });
    expect(formatted).toMatchInlineSnapshot(`
      "foo
        .bar[a = b]
        .baz^(<c, >d)
        .longerSegment"
    `);
  });

  test("escapes strings with special characters inside name nodes", () => {
    let formatted = format(`foo."bar-baz".boo`);
    expect(formatted).toMatchInlineSnapshot(`"foo.\`bar-baz\`.boo"`);

    formatted = format(`foo."true".boo`);
    expect(formatted).toMatchInlineSnapshot(`"foo.\`true\`.boo"`);
  });

  test("handles predicates on the majority of node types", () => {
    let formatted = format(`foo[0]`);
    expect(formatted).toMatchInlineSnapshot(`"foo[0]"`);

    formatted = format(`foo.bar[0]`);
    expect(formatted).toMatchInlineSnapshot(`"foo.bar[0]"`);

    formatted = format(`foo[0].bar`);
    expect(formatted).toMatchInlineSnapshot(`"foo[0].bar"`);

    formatted = format(`$foo[0]`);
    expect(formatted).toMatchInlineSnapshot(`"$foo[0]"`);

    formatted = format(`"foo"[0]`);
    expect(formatted).toMatchInlineSnapshot(`"\\"foo\\"[0]"`);

    formatted = format(`123[0]`);
    expect(formatted).toMatchInlineSnapshot(`"123[0]"`);

    formatted = format(`true[0]`);
    expect(formatted).toMatchInlineSnapshot(`"true[0]"`);

    formatted = format(`null[0]`);
    expect(formatted).toMatchInlineSnapshot(`"null[0]"`);

    formatted = format(`foo(bar)[0]`);
    expect(formatted).toMatchInlineSnapshot(`"foo(bar)[0]"`);

    formatted = format(`{ "foo": bar }[0]`);
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": bar }[0]"`);

    formatted = format(`[foo, bar][0]`);
    expect(formatted).toMatchInlineSnapshot(`"[foo, bar][0]"`);

    formatted = format(`(foo)[0]`);
    expect(formatted).toMatchInlineSnapshot(`"(foo)[0]"`);

    formatted = format(`foo.(bar)[0]`);
    expect(formatted).toMatchInlineSnapshot(`"foo.(bar)[0]"`);

    formatted = format(`foo()[0]`);
    expect(formatted).toMatchInlineSnapshot(`"foo()[0]"`);

    formatted = format(`function() { foo }[0]`);
    expect(formatted).toMatchInlineSnapshot(`"function() { foo }[0]"`);

    formatted = format(`foo.{ "foo": %[0] }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": %[0] }"`);

    formatted = format(`foo.{ "foo": bar.{ "bar": %.%[0] } }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": bar.{ \\"bar\\": %.%[0] } }"`);
  });

  test("handles keepArray on the majority of node types", () => {
    let formatted = format(`foo[]`);
    expect(formatted).toMatchInlineSnapshot(`"foo[]"`);

    formatted = format(`foo.bar[]`);
    expect(formatted).toMatchInlineSnapshot(`"foo.bar[]"`);

    formatted = format(`foo[].bar`);
    expect(formatted).toMatchInlineSnapshot(`"foo[].bar"`);

    formatted = format(`$foo[]`);
    expect(formatted).toMatchInlineSnapshot(`"$foo[]"`);

    formatted = format(`"foo"[]`);
    expect(formatted).toMatchInlineSnapshot(`"\\"foo\\"[]"`);

    formatted = format(`123[]`);
    expect(formatted).toMatchInlineSnapshot(`"123[]"`);

    formatted = format(`true[]`);
    expect(formatted).toMatchInlineSnapshot(`"true[]"`);

    formatted = format(`null[]`);
    expect(formatted).toMatchInlineSnapshot(`"null[]"`);

    formatted = format(`foo(bar)[]`);
    expect(formatted).toMatchInlineSnapshot(`"foo(bar)[]"`);

    formatted = format(`{ "foo": bar }[]`);
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": bar }[]"`);

    formatted = format(`[foo, bar][]`);
    expect(formatted).toMatchInlineSnapshot(`"[foo, bar][]"`);

    formatted = format(`(foo)[]`);
    expect(formatted).toMatchInlineSnapshot(`"(foo)[]"`);

    formatted = format(`foo.(bar)[]`);
    expect(formatted).toMatchInlineSnapshot(`"foo.(bar)[]"`);

    formatted = format(`foo()[]`);
    expect(formatted).toMatchInlineSnapshot(`"foo()[]"`);

    formatted = format(`function() { foo }[]`);
    expect(formatted).toMatchInlineSnapshot(`"function() { foo }[]"`);

    formatted = format(`foo.{ "foo": %[] }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": %[] }"`);

    formatted = format(`foo.{ "foo": bar.{ "bar": %.%[] } }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": bar.{ \\"bar\\": %.%[] } }"`);
  });

  test("handles index and focus on the majority of node types", () => {
    let formatted = format(`foo@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"foo@$j#$i"`);

    formatted = format(`foo.bar@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"foo.bar@$j#$i"`);

    formatted = format(`foo@$j#$i.bar`);
    expect(formatted).toMatchInlineSnapshot(`"foo@$j#$i.bar"`);

    formatted = format(`$foo@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"$foo@$j#$i"`);

    formatted = format(`"foo"@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"\\"foo\\"@$j#$i"`);

    formatted = format(`123@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"123@$j#$i"`);

    formatted = format(`true@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"true@$j#$i"`);

    formatted = format(`null@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"null@$j#$i"`);

    formatted = format(`foo(bar)@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"foo(bar)@$j#$i"`);

    formatted = format(`{ "foo": bar }@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": bar }@$j#$i"`);

    formatted = format(`[foo, bar]@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"[foo, bar]@$j#$i"`);

    formatted = format(`(foo)@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"(foo)@$j#$i"`);

    formatted = format(`foo()@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"foo()@$j#$i"`);

    formatted = format(`function() { foo }@$j#$i`);
    expect(formatted).toMatchInlineSnapshot(`"function() { foo }@$j#$i"`);

    formatted = format(`foo.{ "foo": %@$j#$i }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": %@$j#$i }"`);

    formatted = format(`foo.{ "foo": bar.{ "bar": %.%@$j#$i } }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": bar.{ \\"bar\\": %.%@$j#$i } }"`);
  });

  test("handles grouping on the majority of node types", () => {
    let formatted = format(`foo{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"foo{ k: v }"`);

    formatted = format(`foo.bar{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.bar{ k: v }"`);

    formatted = format(`$foo{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"$foo{ k: v }"`);

    formatted = format(`"foo"{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"\\"foo\\"{ k: v }"`);

    formatted = format(`123{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"123{ k: v }"`);

    formatted = format(`true{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"true{ k: v }"`);

    formatted = format(`null{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"null{ k: v }"`);

    formatted = format(`foo(bar){ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"foo(bar){ k: v }"`);

    formatted = format(`{ "foo": bar }{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"{ \\"foo\\": bar }{ k: v }"`);

    formatted = format(`[foo, bar]{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"[foo, bar]{ k: v }"`);

    formatted = format(`(foo){ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"(foo){ k: v }"`);

    formatted = format(`foo.(bar){ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.(bar){ k: v }"`);

    formatted = format(`foo(){ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"foo(){ k: v }"`);

    formatted = format(`function() { foo }{ k: v }`);
    expect(formatted).toMatchInlineSnapshot(`"function() { foo }{ k: v }"`);

    formatted = format(`foo.{ "foo": %{ k: v } }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": %{ k: v } }"`);

    formatted = format(`foo.{ "foo": bar.{ "bar": %.%{ k: v } } }`);
    expect(formatted).toMatchInlineSnapshot(`"foo.{ \\"foo\\": bar.{ \\"bar\\": %.%{ k: v } } }"`);
  });

  test("preserves comments", () => {
    let formatted = format(`/* look - I have a comment for you */ foo.bar.baz`);
    expect(formatted).toMatchInlineSnapshot(`
      "/* look - I have a comment for you */
      foo.bar.baz"
    `);

    formatted = format(
      `/* let's check this condition */ isConditionOk ? /* we should do the right thing */ $ifYesDoThis() : /* we should do something else */ $ifNoDoAnotherThing()`,
    );
    expect(formatted).toMatchInlineSnapshot(`
      "/* let's check this condition */
      isConditionOk
        ? /* we should do the right thing */
        $ifYesDoThis()
        : /* we should do something else */
        $ifNoDoAnotherThing()"
    `);
  });

  test.each([
    [
      "interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[1].name_N1.identification_code_04",
      "interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[1].name_N1.identification_code_04",
    ],

    [
      '$convertDateTime(interchanges[0].groups[0].transaction_sets[0].heading.beginning_segment_for_purchase_order_BEG.date_05, $dateTime.EDIDateLong, "yyyy-mm-dd")',
      `
$convertDateTime(
  interchanges[0].groups[0].transaction_sets[0].heading.beginning_segment_for_purchase_order_BEG.date_05,
  $dateTime.EDIDateLong,
  "yyyy-mm-dd"
)
      `,
    ],

    [
      '$filter([{ "foo": "1", "bar": 2, "baz": [{ "boo": 3 }] }, { "foo": "1", "bar": 2, "baz": [{ "boo": 3 }] }], function() { true })',
      `
$filter(
  [
    {
      "foo": "1",
      "bar": 2,
      "baz": [{ "boo": 3 }]
    },
    {
      "foo": "1",
      "bar": 2,
      "baz": [{ "boo": 3 }]
    }
  ],
  function() { true }
)
      `,
    ],

    [
      '($originalShipmentIdentificationNumber := heading.beginning_segment_for_transportation_carrier_shipment_status_message_B10.shipment_identification_number_02; $itemsWithMR1 := heading.business_instructions_and_reference_number_L11[reference_identification_qualifier_02 = "MR1"]; $containsMR1 := $itemsWithMR1 ~> $count > 0; $containsMR1 ? $itemsWithMR1.reference_identification_01 : $originalShipmentIdentificationNumber)',
      `
(
  $originalShipmentIdentificationNumber := heading
    .beginning_segment_for_transportation_carrier_shipment_status_message_B10
    .shipment_identification_number_02;
  $itemsWithMR1 := heading.business_instructions_and_reference_number_L11[reference_identification_qualifier_02 = "MR1"];
  $containsMR1 := $itemsWithMR1 ~> $count > 0;
  $containsMR1 ? $itemsWithMR1.reference_identification_01 : $originalShipmentIdentificationNumber
)
      `,
    ],

    [
      '($itemRef := baseline_item_data_PO1.product_service_id_09; $itemRef = "BAK-80310" ? "21" : $itemRef = "1111111" ? "20")',
      `
(
  $itemRef := baseline_item_data_PO1.product_service_id_09;
  $itemRef = "BAK-80310"
    ? "21"
    : $itemRef = "1111111"
      ? "20"
)
      `,
    ],

    [
      '($custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06; $custName = "040132628" ? "Cool Cars" : $custName = "1111111" ? "Lame Cars")',
      `
(
  $custName := interchanges[0].interchange_control_header_ISA.interchange_sender_id_06;
  $custName = "040132628"
    ? "Cool Cars"
    : $custName = "1111111"
      ? "Lame Cars"
)
      `,
    ],

    [
      '($BTitems := interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[name_N1.entity_identifier_code_01 = "bill_to_party_BT"]; $SFitems := interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[name_N1.entity_identifier_code_01 = "ship_from_SF"]; $BTisPresent := $count($BTitems) > 0; $SFisPresent := $count($SFitems) > 0; $itemToMap := $BTisPresent ? $BTitems[0] : $SFisPresent ? $SFitems[0] : null; {"addressType":$itemToMap.name_N1.entity_identifier_code_01,"name":$itemToMap.name_N1.name_02,"address1":$itemToMap.address_information_N3.address_information_01,"address2":undefined,"addressCity":$itemToMap.geographic_location_N4.city_name_01,"addressState":$itemToMap.geographic_location_N4.state_or_province_code_02,"addressZip":$itemToMap.geographic_location_N4.postal_code_03})',
      `
(
  $BTitems := interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[name_N1.entity_identifier_code_01 = "bill_to_party_BT"];
  $SFitems := interchanges[0].groups[0].transaction_sets[0].heading.name_N1_loop[name_N1.entity_identifier_code_01 = "ship_from_SF"];
  $BTisPresent := $count($BTitems) > 0;
  $SFisPresent := $count($SFitems) > 0;
  $itemToMap := $BTisPresent
    ? $BTitems[0]
    : $SFisPresent
      ? $SFitems[0]
      : null;
  {
    "addressType": $itemToMap.name_N1.entity_identifier_code_01,
    "name": $itemToMap.name_N1.name_02,
    "address1": $itemToMap.address_information_N3.address_information_01,
    "address2": undefined,
    "addressCity": $itemToMap.geographic_location_N4.city_name_01,
    "addressState": $itemToMap.geographic_location_N4.state_or_province_code_02,
    "addressZip": $itemToMap.geographic_location_N4.postal_code_03
  }
)
      `,
    ],
    [
      '/* Long-winded expressions might need some explanation */ ($pi := 3.141592653589793;/* JSONata is not known for its graphics support! */$plot := function($x) {($floor := $string ~> $substringBefore(?, ".") ~> $number;$index := $floor(($x + 1) * 20 + 0.5);$join([0..$index].(".")) & "O" & $join([$index..40].(".")))}; /* Factorial is the product of the integers 1..n */ $product := function($a, $b) { $a * $b };$factorial := function($n) { $n = 0 ? 1 : $reduce([1..$n], $product) };$sin := function($x){/* define sine in terms of cosine */ $cos($x - $pi/2)};$cos := function($x){/* Derive cosine by expanding Maclaurin series */ $x > $pi ? $cos($x - 2 * $pi) : $x < -$pi ? $cos($x + 2 * $pi) :$sum([0..12].($power(-1, $) * $power($x, 2*$) / $factorial(2*$)))};[0..24].$sin($*$pi/12).$plot($))',
      `
/* Long-winded expressions might need some explanation */
(
  $pi := 3.141592653589793;
  /* JSONata is not known for its graphics support! */
  $plot := function($x) {
    (
      $floor := $string ~> $substringBefore(?, ".") ~> $number;
      $index := $floor(($x + 1) * 20 + 0.5);
      $join([0..$index].(".")) & "O" & $join([$index..40].("."))
    )
  };
  /* Factorial is the product of the integers 1..n */
  $product := function($a, $b) { $a * $b };
  $factorial := function($n) { $n = 0 ? 1 : $reduce([1..$n], $product) };
  $sin := function($x) {
    /* define sine in terms of cosine */
    $cos($x - $pi / 2)
  };
  $cos := function($x) {
    /* Derive cosine by expanding Maclaurin series */
    $x > $pi
      ? $cos($x - 2 * $pi)
      : $x < -$pi
        ? $cos($x + 2 * $pi)
        : $sum([0..12].($power(-1, $) * $power($x, 2 * $) / $factorial(2 * $)))
  };
  [0..24].$sin($ * $pi / 12).$plot($)
)
      `,
    ],
  ])("can format complex example: %p", (input, expectedOutput) => {
    expect(format(input)).toEqual(expectedOutput.trim());
  });
});
