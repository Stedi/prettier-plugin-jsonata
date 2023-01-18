import prettier from "prettier";
import { JsonataASTNode } from "../../types";
import { formatJsonata, serializeJsonata } from "..";
import jsonata from "jsonata";

describe(serializeJsonata, () => {
  beforeEach(prettier.clearConfigCache);

  test.only("does not fail", () => {
    const result = serializeJsonata(ASTThatFails);
    console.log(result);
  });

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

const ASTThatFails = {
  consarray: false,
  expressions: [
    {
      lhs: [
        [
          { value: "heading", type: "string", position: 19 },
          {
            type: "unary",
            position: 0,
            value: "{",
            lhs: [
              [
                { value: "transaction_set_header_ST", type: "string", position: 56 },
                {
                  type: "unary",
                  position: 0,
                  value: "{",
                  lhs: [
                    [
                      { value: "transaction_set_identifier_code_01", type: "string", position: 104 },
                      { value: "940", type: "string", position: 111 },
                    ],
                    [
                      { value: "transaction_set_control_number_02", type: "string", position: 156 },
                      {
                        type: "path",
                        steps: [
                          { value: "$", type: "variable", position: 160 },
                          { value: "ediMetadata", type: "name", position: 172 },
                          { value: "transactionSetControlNumber", type: "name", position: 200 },
                        ],
                      },
                    ],
                  ],
                },
              ],
              [
                { value: "shipping_order_identification_W05", type: "string", position: 251 },
                {
                  type: "unary",
                  position: 0,
                  value: "{",
                  lhs: [
                    [
                      { value: "order_status_code_01", type: "string", position: 285 },
                      {
                        type: "path",
                        steps: [
                          {
                            type: "function",
                            value: "(",
                            position: 300,
                            arguments: [
                              {
                                type: "path",
                                steps: [
                                  { value: "tables", type: "variable", position: 307 },
                                  { value: "OrderType", type: "name", position: 317 },
                                ],
                              },
                              { value: "Key", type: "string", position: 324 },
                              {
                                type: "path",
                                steps: [
                                  { value: "$", type: "variable", position: 328 },
                                  { value: "orderType", type: "name", position: 338 },
                                ],
                              },
                            ],
                            procedure: { value: "lookupTable", type: "variable", position: 299 },
                          },
                          { value: "Value", type: "name", position: 345 },
                        ],
                      },
                    ],
                    [
                      { value: "depositor_order_number_02", type: "string", position: 382 },
                      {
                        type: "path",
                        steps: [
                          { value: "$", type: "variable", position: 386 },
                          { value: "order", type: "name", position: 392 },
                          { value: "orderNumber", type: "name", position: 404 },
                        ],
                      },
                    ],
                    [
                      { value: "purchase_order_number_03", type: "string", position: 440 },
                      { type: "path", steps: [{ value: "undefined", type: "name", position: 451 }] },
                    ],
                  ],
                },
              ],
              [
                { value: "name_N1_loop", type: "string", position: 481 },
                {
                  type: "path",
                  steps: [
                    {
                      type: "unary",
                      value: "[",
                      position: 484,
                      expressions: [
                        {
                          type: "path",
                          steps: [
                            { value: "$", type: "variable", position: 486 },
                            { value: "shipToFacility", type: "name", position: 501 },
                          ],
                        },
                      ],
                      consarray: true,
                    },
                    {
                      lhs: [
                        [
                          { value: "name_N1", type: "string", position: 533 },
                          {
                            lhs: [
                              [
                                { value: "entity_identifier_code_01", type: "string", position: 576 },
                                { value: "ST", type: "string", position: 582 },
                              ],
                              [
                                { value: "name_02", type: "string", position: 605 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 608 },
                                    { value: "name", type: "name", position: 613 },
                                  ],
                                },
                              ],
                              [
                                { value: "identification_code_qualifier_03", type: "string", position: 661 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 664 },
                                    { value: "identificationQualifier", type: "name", position: 688 },
                                  ],
                                },
                              ],
                              [
                                { value: "identification_code_04", type: "string", position: 726 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 729 },
                                    { value: "identificationCode", type: "name", position: 748 },
                                  ],
                                },
                              ],
                            ],
                            position: 0,
                            type: "unary",
                            value: "{",
                          },
                        ],
                        [
                          { value: "address_information_N3", type: "string", position: 796 },
                          {
                            type: "unary",
                            value: "[",
                            expressions: [
                              {
                                lhs: [
                                  [
                                    { value: "address_information_01", type: "string", position: 825 },
                                    {
                                      type: "path",
                                      steps: [
                                        { value: "", type: "variable", position: 828 },
                                        { value: "address", type: "name", position: 836 },
                                        { value: "street", type: "name", position: 843 },
                                      ],
                                    },
                                  ],
                                  [
                                    { value: "address_information_02", type: "string", position: 869 },
                                    { type: "path", steps: [{ value: "undefined", type: "name", position: 880 }] },
                                  ],
                                ],
                                position: 0,
                                type: "unary",
                                value: "{",
                              },
                            ],
                            position: 0,
                            consarray: false,
                          },
                        ],
                        [
                          { value: "geographic_location_N4", type: "string", position: 919 },
                          {
                            lhs: [
                              [
                                { value: "city_name_01", type: "string", position: 949 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 952 },
                                    { value: "address", type: "name", position: 960 },
                                    { value: "city", type: "name", position: 965 },
                                  ],
                                },
                              ],
                              [
                                { value: "state_or_province_code_02", type: "string", position: 1006 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 1009 },
                                    { value: "address", type: "name", position: 1017 },
                                    { value: "state", type: "name", position: 1023 },
                                  ],
                                },
                              ],
                              [
                                { value: "postal_code_03", type: "string", position: 1053 },
                                {
                                  type: "path",
                                  steps: [
                                    { value: "", type: "variable", position: 1056 },
                                    { value: "address", type: "name", position: 1064 },
                                    { value: "zipcode", type: "name", position: 1072 },
                                  ],
                                },
                              ],
                              [
                                { type: "string", value: "country_code_04", position: 0 },
                                {
                                  type: "path",
                                  position: 0,
                                  steps: [{ value: "undefined", type: "name", position: 0 }],
                                },
                              ],
                            ],
                            position: 0,
                            type: "unary",
                            value: "{",
                          },
                        ],
                      ],
                      position: 0,
                      type: "unary",
                      value: "{",
                      keepArray: true,
                    },
                  ],
                  keepSingletonArray: true,
                },
              ],
              [
                { value: "date_time_G62", type: "string", position: 1119 },
                {
                  type: "path",
                  steps: [
                    {
                      type: "function",
                      value: "(",
                      position: 1129,
                      arguments: [
                        {
                          type: "path",
                          steps: [
                            { value: "$", type: "variable", position: 1131 },
                            { value: "requestedDeliveryDate", type: "name", position: 1153 },
                          ],
                        },
                        {
                          type: "path",
                          steps: [
                            { value: "$", type: "variable", position: 1157 },
                            { value: "requestedShipDate", type: "name", position: 1175 },
                          ],
                        },
                      ],
                      procedure: { value: "append", type: "variable", position: 1128 },
                      index: "myIndex",
                      tuple: true,
                    },
                    {
                      lhs: [
                        [
                          { value: "date_qualifier_01", type: "string", position: 1216 },
                          {
                            type: "condition",
                            position: 1228,
                            condition: { value: "myIndex", type: "variable", position: 1226 },
                            then: { value: "10", type: "string", position: 1233 },
                            else: { value: "02", type: "string", position: 1240 },
                          },
                        ],
                        [
                          { value: "date_02", type: "string", position: 1251 },
                          { value: "", type: "variable", position: 1254 },
                        ],
                      ],
                      position: 0,
                      type: "unary",
                      value: "{",
                      keepArray: true,
                    },
                  ],
                  keepSingletonArray: true,
                },
              ],
              { type: "unary", value: "{", position: 1, lhs: [] },
            ],
          },
        ],
      ],
      position: 0,
      type: "unary",
      value: "{",
      keepArray: false,
    },
  ],
  position: 0,
  type: "unary",
  value: "[",
};
