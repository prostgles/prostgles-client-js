import * as ts from "typescript";

export const getCallSignatures = (
  type: ts.Type,
  checker: ts.TypeChecker,
): readonly ts.Signature[] => {
  // union types like A | B
  if (type.isUnion()) {
    return type.types.flatMap((t) => getCallSignatures(t, checker));
  }

  // Get call signatures directly if available
  const signatures = type.getCallSignatures();
  if (signatures.length) {
    return signatures;
  }

  // Check if it's a type reference and get its target type
  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      const typeReference = type as ts.TypeReference;
      const target = typeReference.target;
      return getCallSignatures(target, checker);
    }
  }

  // WHY?
  // Look through type.types array if present
  // if ("types" in type && Array.isArray(type.types)) {
  //   return type.types.flatMap((t) => getCallSignatures(t, checker));
  // }

  return [];
};
