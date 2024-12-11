import * as fs from "fs";
import * as ts from "typescript";
import { loadTsFile } from "./loadTsFile";
import { getSerializableType, TS_Type, VisitedTypesMap } from "./getSerializableType";
import { generateMDX } from "./generateMarkdown";
import { isDefined } from "prostgles-types";

type Args = {
  filePath: string;
  filter?: {
    nodeNames: string[];
    excludedTypes: string[];
  };
};
const parseTypeDefinition = ({ filePath, filter }: Args) => {
  const { checker, sourceFile } = loadTsFile(filePath);

  const results: TS_Type[] = [];
  const visitedMaps: VisitedTypesMap[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIntersectionTypeNode(node.type) &&
      (!filter || filter?.nodeNames.includes(node.name.text))
    ) {
      const type1 = checker.getTypeAtLocation(node.type);
      const { resolvedType, visited } = getSerializableType(type1, checker, undefined, [], filter);
      results.push(resolvedType);
      visitedMaps.push(visited);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { resolvedTypes: results, visitedMaps };
};

const filePath = `${__dirname}/../../dist/prostgles.d.ts`;

const excludedTypes = [
  "FullFilter",
  "FullFilter<T, S> | undefined",
  "FieldFilter | undefined",
  "SyncOptions",
  "SyncOneOptions",
  "PG_COLUMN_UDT_DATA_TYPE",
];
const { resolvedTypes, visitedMaps } = parseTypeDefinition({
  filePath,
  filter: {
    nodeNames: [
      // "ViewHandlerClient",
      "TableHandlerClient",
    ],
    excludedTypes,
  },
});

const docsFolder = `${__dirname}/../../docs`;
const jsonTypes = JSON.stringify(
  [
    ...resolvedTypes,
    ...visitedMaps
      .flatMap((m) =>
        Array.from(m.values()).map((v) =>
          excludedTypes.includes(v.resolvedType.alias ?? "") ? v.resolvedType : undefined,
        ),
      )
      .filter(isDefined),
  ] satisfies TS_Type[],
  null,
  2,
);
fs.writeFileSync(
  `${docsFolder}/definitions.ts`,
  [
    `import type { TS_Type } from "./getSerializableType";`,
    `export const definitions = ${jsonTypes} as const satisfies TS_Type[];`,
  ].join("\n"),
  {
    encoding: "utf-8",
  },
);

const docPath = `${__dirname}/../../docs/README.md`;
const mdx = generateMDX(docPath);
