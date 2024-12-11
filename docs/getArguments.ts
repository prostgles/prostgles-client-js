import * as ts from "typescript";
import { getSymbolComments, resolveCommentsForSymbol } from "./getSymbolComments";

export const getArguments = (
  signature: ts.Signature,
  checker: ts.TypeChecker,
): { name: string; type: string; comments: string }[] => {
  return signature.parameters.map((parameter) => {
    const paramName = parameter.getName();
    const paramType = checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!);
    const paramTypeName = checker.typeToString(paramType);
    let paramComments =
      getSymbolComments(parameter, checker) || resolveCommentsForSymbol(parameter);

    // If comments are not found, try resolving the type declaration for comments
    if (!paramComments && paramType.symbol) {
      const declarations = paramType.symbol.getDeclarations();
      if (declarations && declarations.length > 0) {
        const declaration = declarations[0]; // Use the first declaration
        if (declaration) {
          const sourceFile = declaration.getSourceFile();
          const commentRanges = ts.getLeadingCommentRanges(
            sourceFile.getFullText(),
            declaration.getFullStart(),
          );

          // const lines = sourceFile.getFullText().split("\n");
          // console.log(
          //   paramTypeName,
          //   lines.filter((line) => line.includes(paramTypeName)),
          // );
          if (commentRanges) {
            paramComments = commentRanges
              .map((range) =>
                sourceFile
                  .getFullText()
                  .slice(range.pos, range.end)
                  .replace(/\/\*|\*\//g, "")
                  .trim(),
              )
              .join(" ");
          }
        }

        // Handle specific fields within SelectParams
        if (!paramComments && declaration && ts.isTypeLiteralNode(declaration)) {
          declaration.members.forEach((member) => {
            if (
              ts.isPropertySignature(member) &&
              member.name &&
              ts.isIdentifier(member.name) &&
              member.name.text === paramName
            ) {
              const sourceFile = member.getSourceFile();
              const fullText = sourceFile.getFullText();

              const commentRanges = ts.getLeadingCommentRanges(fullText, member.getFullStart());
              if (commentRanges) {
                paramComments = commentRanges
                  .map((range) =>
                    fullText
                      .slice(range.pos, range.end)
                      .replace(/\/\*|\*\//g, "")
                      .trim(),
                  )
                  .join(" ");
              }
            }
          });
        }
      }
    }

    return { name: paramName, type: paramTypeName, comments: paramComments };
  });
};
