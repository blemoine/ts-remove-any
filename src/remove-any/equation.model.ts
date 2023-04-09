import { Node } from "ts-morph";
import { getSerializedTypeModel, TypeModel } from "./type-model/type-model";

export type TypeEquationRelation = "subtype" | "supertype" | "equal";

export class TypeEquation {
  constructor(private nodeText: string, private relation: TypeEquationRelation, public type: TypeModel) {}

  toString() {
    const nodeText = this.nodeText;
    const typeName = getSerializedTypeModel(this.type).name;
    const relation = this.relation === "equal" ? "equal to" : this.relation + " of ";

    return `the type of ${nodeText} is ${relation} ${typeName}`;
  }
}
