import { getObjectEntries } from "prostgles-types";
import { definitions } from "./definitions";
import { TS_Function, TS_Type } from "./getSerializableType";
import * as fs from "fs";

const getAliasWithoutGenerics = (type: TS_Type) => {
  if (type.type === "union") return type.types.map(getAliasWithoutGenerics).join(" | ");
  return type.aliasSymbolescapedName || type.alias;
};

export const generateMDX = (filePath: string) => {
  const tableHandler = definitions[0];
  const mdxContent = getObjectEntries(tableHandler.properties).map(([methodName, _methodInfo]) => {
    const methodInfo = (
      _methodInfo.type === "function" ?
        (_methodInfo as TS_Function)
        // : _methodInfo.type === "union" ? _methodInfo.types.find((t) => t.type === "function")
      : undefined) as TS_Function | undefined;
    if (!methodInfo) return "";
    return [
      `## db.tableName.${methodName}()`,
      methodInfo.comments ?? "",
      `\`\`\`typescript
  (${methodInfo.arguments.map((arg) => `${arg.name}${arg.optional ? "?" : ""}: ${getAliasWithoutGenerics(arg)}`).join(", ")}): ${
    methodInfo.returnType.aliasSymbolescapedName || methodInfo.returnType.alias
  }
  \`\`\``,
      `#### Arguments`,
      ...methodInfo.arguments.map((arg) => {
        const firstLine = ` - \`${arg.name}: ${arg.alias || arg.aliasSymbolescapedName}\` - ${arg.comments ?? ""}`;
        if (arg.type === "object") {
          return [
            firstLine,
            ...getObjectEntries(arg.properties).map(
              ([name, p]) =>
                `   - \`${name}: ${p.alias || p.aliasSymbolescapedName}\` - ${p.comments ?? ""}`,
            ),
          ].join("\n");
        }
        return firstLine;
      }),
      `#### Returns`,
    ].join("\n");
  });
  const result = mdxContent.join("\n\n");

  fs.writeFileSync(filePath, result, { encoding: "utf-8" });
};

const renderType = (
  type: TS_Type,
  indent = 2,
  argOrProp: { name: string; optional: boolean } | undefined,
) => {
  const indentText = " ".repeat(indent);
  const title = `${indentText}${argOrProp?.name ? `${argOrProp.name}` : ""}${type.aliasSymbolescapedName || type.alias}`;
  if (type.type === "primitive" || type.type === "literal") {
    return `${title} - ${type.comments ?? ""}`;
  }
  if (type.type === "object") {
    return [
      `<details>`,
      `<summary>${argOrProp?.name || type.aliasSymbolescapedName || type.alias}</summary>`,
      ...getObjectEntries(type.properties).map(([name, p]) =>
        renderType(p, indent + 2, { name, optional: p.optional }),
      ),
      `</details>`,
    ].join("\n");
  }
};
