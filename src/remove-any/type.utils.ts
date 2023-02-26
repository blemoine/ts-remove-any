import { TypedNode, Node, Type } from "ts-morph";

export function isImplicitAny(node: TypedNode & Node) {
  const isAny = node.getType().isAny();
  const declaredType = node.getTypeNode();
  return isAny && !declaredType;
}

export function computeTypesFromList(callsiteTypes: Type[]): string | null {
  if (callsiteTypes.length === 0) {
    return null;
  }
  if (callsiteTypes.every((s) => s.isBooleanLiteral() || s.isBoolean())) {
    return "boolean";
  }
  if (callsiteTypes.length === 1) {
    return callsiteTypes[0].getText();
  }
  if (callsiteTypes.length <= 4) {
    if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral()) && callsiteTypes.some((t) => t.isNumber())) {
      return "number";
    }
    if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral()) && callsiteTypes.some((t) => t.isString())) {
      return "string";
    }

    const newTypes = [...new Set(callsiteTypes.map((t) => t.getText()))];
    return newTypes.join(" | ");
  }

  if (callsiteTypes.every((t) => t.isNumber() || t.isNumberLiteral())) {
    return "number";
  } else if (callsiteTypes.every((t) => t.isString() || t.isStringLiteral())) {
    return "string";
  }
  return null;
}
