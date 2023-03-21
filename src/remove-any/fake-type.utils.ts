/* eslint-disable @typescript-eslint/ban-types */
import { isNonEmptyList, NonEmptyList } from "../utils/non-empty-list";
import { getText, TypeModel } from "./type-model/type-model";

interface AndType {
  and: [TypeWithName, TypeWithName];
}
export type TypeWithName = TypeModel | { literal: Record<string, TypeWithName> } | AndType;

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
        const typeText = getStringifiedType(type);
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

export function getStringifiedType(t1: TypeWithName): string {
  if ("literal" in t1) {
    return (
      "{" +
      Object.entries(t1.literal)
        .map(([k, v]) => `"${k}": ${getStringifiedType(v)}`)
        .join(", ") +
      "}"
    );
  } else if ("and" in t1) {
    const [firstType, secondType] = t1.and;
    return getStringifiedType(firstType) + " & " + getStringifiedType(secondType);
  } else {
    return getText(t1);
  }
}
