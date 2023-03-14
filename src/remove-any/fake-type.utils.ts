/* eslint-disable @typescript-eslint/ban-types */
import { Type, Symbol } from "ts-morph";
import { NonEmptyList } from "../utils/non-empty-list";

export interface FakeType {
  getText(): string;
  isAny(): boolean;
  isNever(): boolean;
  isArray(): boolean;
  isNumber(): boolean;
  isNumberLiteral(): boolean;
  isString(): boolean;
  isStringLiteral(): boolean;
  isBoolean(): boolean;
  isBooleanLiteral(): boolean;
  getTypeArguments(): Type[];
  // eslint-disable-next-line no-unused-vars
  getProperty(_name: string): Symbol | undefined;
}

export function createFakeType(str: string): FakeType {
  return {
    getText(): string {
      return str;
    },
    isAny(): boolean {
      return str === "any";
    },
    isNever(): boolean {
      return str === "never";
    },
    isArray(): boolean {
      return str.endsWith("[]");
    },
    isNumber(): boolean {
      return str === "number" || this.isNumberLiteral();
    },
    isNumberLiteral(): boolean {
      return !!str.match(/d+/);
    },
    isString(): boolean {
      return str === "string" || this.isStringLiteral();
    },
    isStringLiteral(): boolean {
      return str.startsWith('"') && str.endsWith('"');
    },
    isBoolean(): boolean {
      return str === "boolean" || this.isBooleanLiteral();
    },
    isBooleanLiteral(): boolean {
      return str === "true" || str === "false";
    },
    getTypeArguments(): Type[] {
      throw new Error("not implemented in FakeType");
    },
    getProperty(): Symbol | undefined {
      throw new Error("not implemented in FakeType");
    },
  };
}

export type TypeWithName = FakeType | { literal: Record<string, TypeWithName> } | { and: [TypeWithName, TypeWithName] };

export function mergeTypeWithName(t1: TypeWithName, t2: TypeWithName): TypeWithName {
  if ("literal" in t1) {
    if ("literal" in t2) {
      return Object.entries(t2.literal).reduce(
        (acc, [k, v]) => {
          if (acc.literal[k]) {
            acc.literal[k] = mergeTypeWithName(t1.literal[k], v);
          } else {
            acc.literal[k] = v;
          }

          return acc;
        },
        { ...t1 }
      );
    } else if ("and" in t2) {
      const [firstType, secondType] = t2.and;
      return { and: [firstType, mergeTypeWithName(t1, secondType)] };
    } else {
      return { and: [t1, t2] };
    }
  } else if ("and" in t1) {
    const [firstType, secondType] = t1.and;
    return { and: [firstType, mergeTypeWithName(secondType, t2)] };
  } else {
    return { and: [t1, t2] };
  }
}

export function mergeTypeWithNames(typeWithNames: NonEmptyList<TypeWithName>): TypeWithName {
  return typeWithNames.reduce(mergeTypeWithName);
}

export function getStringifiedType(t1: TypeWithName): FakeType {
  if ("literal" in t1) {
    return createFakeType(
      "{" +
        Object.entries(t1.literal)
          .map(([k, v]) => `"${k}": ${getStringifiedType(v).getText()}`)
          .join(", ") +
        "}"
    );
  } else if ("and" in t1) {
    const [firstType, secondType] = t1.and;
    return createFakeType(getStringifiedType(firstType).getText() + " & " + getStringifiedType(secondType).getText());
  } else {
    return t1;
  }
}
