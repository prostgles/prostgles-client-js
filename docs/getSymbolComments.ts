import * as ts from "typescript";
import * as fs from "fs";
import { resolveModuleWithTypescript } from "./moduleResolver";

export const getSymbolComments = (symbol: ts.Symbol, checker: ts.TypeChecker): string => {
  const comments = symbol.getDocumentationComment(checker);
  return comments
    .map((comment) => comment.text)
    .join(" ")
    .trim();
};

/**
 * Resolves comments for a symbol, including handling imported types.
 *
 * @param symbol - The symbol to resolve comments for.
 * @param checker - The TypeChecker instance.
 * @returns The comments associated with the symbol or its imported type.
 */
export const resolveCommentsForSymbol = (symbol: ts.Symbol): string => {
  const declarations = symbol.getDeclarations();
  const [declaration] = declarations || [];
  if (declaration) {
    const sourceFile = declaration.getSourceFile();

    // Check if the source file belongs to an imported module
    if (fs.existsSync(sourceFile.fileName)) {
      const fullText = sourceFile.getFullText();
      const commentRanges = ts.getLeadingCommentRanges(fullText, declaration.getFullStart());
      if (commentRanges) {
        return commentRanges
          .map((range) =>
            fullText
              .slice(range.pos, range.end)
              .replace(/\/\*|\*\//g, "")
              .trim(),
          )
          .join(" ");
      }
    }

    // If the type is imported, recursively resolve the type definition
    if (ts.isImportDeclaration(declaration)) {
      const moduleSpecifier = (declaration.moduleSpecifier as ts.StringLiteral).text;
      const resolvedPath = resolveModuleWithTypescript(moduleSpecifier, sourceFile.fileName);

      if (resolvedPath) {
        const importedProgram = ts.createProgram([resolvedPath], {});
        const importedSourceFile = importedProgram.getSourceFile(resolvedPath);
        if (importedSourceFile) {
          const importedChecker = importedProgram.getTypeChecker();
          //@ts-ignore
          const importedSymbol = importedChecker.getSymbolAtLocation(declaration.name!);
          if (importedSymbol) {
            return resolveCommentsForSymbol(importedSymbol);
          }
        }
      }
    }
  }
  return "";
};
