/* eslint-disable @typescript-eslint/ban-types */
import { Node, Type } from "ts-morph";
import { isNonEmptyList, NonEmptyList } from "../utils/non-empty-list";

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
  getTypeArguments(): FakeType[];
  // eslint-disable-next-line no-unused-vars
  getProperty(name: string, atLocation: Node): FakeType | undefined;
}

export function createFakeTypeFromType(type: Type): FakeType {
  return {
    ...createFakeType(type.getText()),
    getTypeArguments(): FakeType[] {
      return type.getTypeArguments().map(createFakeTypeFromType);
    },
    getProperty(name: string, atLocation: Node): FakeType | undefined {
      const typeAtLocation = type?.getProperty(name)?.getTypeAtLocation(atLocation);
      return typeAtLocation ? createFakeTypeFromType(typeAtLocation) : undefined;
    },
  };
}

export function createFakeTypeFromObjectLiteral(
  propertyTypePairs: { propertyName: string; type: FakeType }[]
): FakeType {
  const text = `{${propertyTypePairs
    .map(({ propertyName, type }) => {
      return `"${propertyName}": ${type.getText()}`;
    })
    .join(", ")}}`;
  return {
    ...createFakeType(text),
    getProperty(name: string): FakeType | undefined {
      return propertyTypePairs.find(({ propertyName }) => propertyName === name)?.type;
    },
  };
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
      return str === "number";
    },
    isNumberLiteral(): boolean {
      return !!str.match(/^\d+$/);
    },
    isString(): boolean {
      return str === "string";
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
    getTypeArguments(): FakeType[] {
      console.debug("not implemented in FakeType");
      return [];
    },
    getProperty(): FakeType | undefined {
      console.debug("not implemented in FakeType");
      return undefined;
    },
  };
}

interface AndType {
  and: [TypeWithName, TypeWithName];
}
export type TypeWithName = FakeType | { literal: Record<string, TypeWithName> } | AndType;

export function getSuperTypeWithName(t1: TypeWithName, t2: TypeWithName): TypeWithName {
  if ("literal" in t1) {
    if ("literal" in t2) {
      return Object.entries(t2.literal).reduce(
        (acc, [k, v]) => {
          if (acc.literal[k]) {
            acc.literal[k] = getSuperTypeWithName(t1.literal[k], v);
          } else {
            acc.literal[k] = v;
          }

          return acc;
        },
        { ...t1 }
      );
    } else if ("and" in t2) {
      const [firstType, secondType] = t2.and;
      return deduplicate({ and: [firstType, getSuperTypeWithName(t1, secondType)] });
    } else {
      return deduplicate({ and: [t1, t2] });
    }
  } else if ("and" in t1) {
    const [firstType, secondType] = t1.and;
    return deduplicate({ and: [firstType, getSuperTypeWithName(secondType, t2)] });
  } else {
    return deduplicate({ and: [t1, t2] });
  }
}

function getAllAnds({ and: [firstType, secondType] }: AndType): NonEmptyList<TypeWithName> {
  const firstHalf = "and" in firstType ? getAllAnds(firstType) : ([firstType] as const);
  const secondHalf = "and" in secondType ? getAllAnds(secondType) : ([secondType] as const);

  return [...firstHalf, ...secondHalf];
}

function deduplicate(andType: AndType): TypeWithName {
  const allAnds = getAllAnds(andType);
  const deduplicatedAllAnds = deduplicateTypes(allAnds);

  if (deduplicatedAllAnds.length === 1) {
    return deduplicatedAllAnds[0];
  } else {
    const first = deduplicatedAllAnds[0];
    const second = deduplicatedAllAnds[1];

    return deduplicatedAllAnds.slice(2).reduce((acc, type) => ({ and: [acc, type] }), { and: [first, second] });
  }
}

function deduplicateTypes(types: NonEmptyList<TypeWithName>): NonEmptyList<TypeWithName> {
  const result = [
    ...types
      .reduce((map, type) => {
        const typeText = getStringifiedType(type).getText();
        if (!map.has(typeText)) {
          map.set(typeText, type);
        }
        return map;
      }, new Map<string, TypeWithName>())
      .values(),
  ];

  if (!isNonEmptyList(result)) {
    throw new Error(`There is no way the reduce above generate an empty list`);
  }
  return result;
}

export function getSupertype(typeWithNames: NonEmptyList<TypeWithName>): TypeWithName {
  return typeWithNames.reduce(getSuperTypeWithName);
}

export function getStringifiedType(t1: TypeWithName): FakeType {
  if ("literal" in t1) {
    return createFakeTypeFromObjectLiteral(
      Object.entries(t1.literal).map(([k, v]) => ({ propertyName: k, type: getStringifiedType(v) }))
    );
  } else if ("and" in t1) {
    const [firstType, secondType] = t1.and;
    return createFakeType(getStringifiedType(firstType).getText() + " & " + getStringifiedType(secondType).getText());
  } else {
    return t1;
  }
}
