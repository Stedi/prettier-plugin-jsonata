# Prettier plugin for JSONata language

Format your JSONata expressions using Prettier.

## How it works

A Prettier plugin must first parse the source code of the target language
into a traversable data structure (Usually an **A**bstract **S**yntax **T**ree)
and then print out that data structure in a "pretty" style.

**prettier-plugin-jsonata** uses the [JSONata parser](https://github.com/jsonata-js/jsonata/blob/master/src/parser.js) available as part of the [jsonata](https://github.com/jsonata-js/jsonata) package.

## Status

- The plugin supports all JSONata feature up to 1.8.6 version, and is backward compatible with 1.7.0 release.
- The plugin can output formatted code for any AST node type.
- Only `printWidth`, `tabWidth`, and `useTabs` formatting options are supported.
- Native integration with code editors is not supported due to the lack of IDE extensions providing JSONata language support. Once such extensions are available, it should become possible to format JSONata documents on save when this plugin is installed.

## Install

```bash
# Install locally in a project
npm install --save-dev @stedi-oss/prettier-plugin-jsonata prettier

# Or globally
npm install -g @stedi-oss/prettier-plugin-jsonata prettier
```

## Usage with the CLI

Once you installed `prettier` and `prettier-plugin-jsonata` as dev dependencies in your project,
you can format your code using Prettier CLI.

```
npx prettier --write ./**/*.jsonata
```

## Programmatic usage

You can format your JSONata expressions using Prettier's own `format` method like this:

```ts
import * as prettier from "prettier";
import * as prettierPlugin from "@stedi-oss/prettier-plugin-jsonata";

const expression = "($myVar:=foo.bar[]; $reverse($myVar))";
const formattedExpression = prettier.format(expression, {
  parser: prettierPlugin.AST_PARSER_NAME,
  plugins: [prettierPlugin],
  printWidth: 150,
  tabWidth: 2,
  useTabs: false,
});

console.log(formattedExpression);
```

Alternatively, you can use the `formatJsonata` function:

```ts
import { formatJsonata } from "@stedi-oss/prettier-plugin-jsonata/dist/lib";

const expression = "($myVar:=foo.bar[]; $reverse($myVar))";
const formattedExpression = formatJsonata(expression);

console.log(formattedExpression);
```

If you parse JSONata as part of your business logic and only need to print JSONata AST tree as a formatted string,
you can use `serializeJsonata` function:

```ts
import jsonata from "jsonata";
import { serializeJsonata } from "@stedi-oss/prettier-plugin-jsonata/dist/lib";

const jsonataAST = jsonata("($myVar:=foo.bar[]; $reverse($myVar))").ast();
const formattedExpression = serializeJsonata(jsonataAST);

console.log(formattedExpression);
```
