import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

/**
 * Resolves module imports to their actual file paths.
 *
 * @param importPath - The import module path as written in the TypeScript file.
 * @param currentFilePath - The file path of the current file where the import is used.
 * @returns The resolved file path for the module or `undefined` if not found.
 */
const _importResolver = (importPath: string, currentFilePath: string): string | undefined => {
  // If the import path is relative, resolve it relative to the current file
  if (importPath.startsWith(".")) {
    const resolvedPath = path.resolve(path.dirname(currentFilePath), importPath);
    if (fs.existsSync(`${resolvedPath}.ts`)) {
      return `${resolvedPath}.ts`;
    } else if (fs.existsSync(`${resolvedPath}/index.ts`)) {
      return `${resolvedPath}/index.ts`;
    }
  } else {
    // Resolve node_modules package paths
    try {
      const resolvedPath = require.resolve(importPath, { paths: [path.dirname(currentFilePath)] });
      return resolvedPath.endsWith(".d.ts") ? resolvedPath : undefined; // Ensure it's a TypeScript definition file
    } catch {
      return undefined; // Import not found
    }
  }

  return undefined;
};

type MethodDefinition = {
  name: string;
  comments: string;
  arguments: { name: string; comments: string }[];
};

type TypeDefinition = {
  name: string;
  comments: string;
  methods: MethodDefinition[];
};

type Result = TypeDefinition[];

/**
 * Extracts type definitions with comments from a TypeScript file.
 *
 * @param filePath - Path to the TypeScript file to analyze.
 * @param importResolver - Function to resolve imported types.
 * @returns An array of extracted type definitions.
 */
export function extractTypeDefinitions(filePath: string, importResolver = _importResolver): Result {
  const fileContent = ts.sys.readFile(filePath);
  if (!fileContent) {
    throw new Error(`Unable to read file: ${filePath}`);
  }

  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

  const results: Result = [];

  const getLeadingComments = (node: ts.Node): string => {
    const comments = ts.getLeadingCommentRanges(fileContent, node.pos);
    if (!comments) return "";
    return comments
      .map((range) =>
        fileContent
          .slice(range.pos, range.end)
          .replace(/\/\*|\*\//g, "")
          .trim(),
      )
      .join("\n");
  };

  function extractMethod(node: ts.MethodSignature | ts.MethodDeclaration): MethodDefinition {
    const name = node.name.getText();
    const comments = getLeadingComments(node);
    const args = node.parameters.map((param) => {
      const paramName = param.name.getText();
      const paramComments = getLeadingComments(param);
      return { name: paramName, comments: paramComments };
    });
    return { name, comments, arguments: args };
  }

  function extractType(node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration): TypeDefinition {
    const name = node.name.getText();
    const comments = getLeadingComments(node);
    const methods: MethodDefinition[] = [];
    if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach((member) => {
        if (ts.isMethodSignature(member)) {
          methods.push(extractMethod(member));
        }
      });
    } else if (ts.isInterfaceDeclaration(node)) {
      node.members.forEach((member) => {
        if (ts.isMethodSignature(member)) {
          methods.push(extractMethod(member));
        }
      });
    }
    return { name, comments, methods };
  }

  function visitNode(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      results.push(extractType(node));
    }

    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const importPath = node.moduleSpecifier.getText().replace(/['"]/g, "");
      const resolvedPath = importResolver(importPath, filePath);
      if (resolvedPath) {
        const importedTypes = extractTypeDefinitions(resolvedPath, importResolver);
        results.push(...importedTypes);
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
  return results;
}
