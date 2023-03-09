import { FunctionDeclaration, Node, Type } from "ts-morph";
import { isNotNil } from "../../utils/is-not-nil";

interface CallableType {
  parameterTypes: Type[];
  argumentsTypes: Type[][];
}

// TODO check CallLikeExpression ?
export function getCallablesTypes(functionDeclaration: FunctionDeclaration): CallableType {
  const argumentsTypes = functionDeclaration
    .findReferencesAsNodes()
    .map((ref) => {
      const parent = ref.getParent();
      if (Node.isCallExpression(parent)) {
        return parent.getArguments().map((argument) => argument.getType());
      }
      return null;
    })
    .filter(isNotNil);

  const parameterTypes = functionDeclaration.getParameters().map((p) => p.getType());

  return { parameterTypes, argumentsTypes };
}
