import { factory, SyntaxKind } from "typescript";
import { Arg, ArgType } from "../Intermediate/IntermediateStructure";

export default function createParameters(args: Arg[]) {
  return args.map((arg) => {
    const name = factory.createIdentifier(arg.name);
    const type = factory.createKeywordTypeNode(mapType(arg.type));
    return factory.createParameterDeclaration(undefined, undefined, name, undefined, type);
  });
}

function mapType(argType: ArgType) {
  switch (argType) {
    case ArgType.String:
      return SyntaxKind.StringKeyword;
    case ArgType.Number:
      return SyntaxKind.NumberKeyword;
    case ArgType.Object:
      return SyntaxKind.ObjectKeyword;
  }
}
