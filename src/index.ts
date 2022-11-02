import { createSourceFile, ScriptTarget, ScriptKind, createPrinter, EmitHint, factory } from "typescript";
import convertObject from "./JsonToIntermediate/JsonConversion";
import createExpression from "./IntermediateToTypeScript/ExpressionCreation";

export function getTypeScriptFromString(i18nJson: string, isDefaultExport = false) {
  return getTypeScriptFromObject(JSON.parse(i18nJson), isDefaultExport);
}

export function getTypeScriptFromObject<T extends object>(i18nJson: T, isDefaultExport = false) {
  const intermediate = convertObject(i18nJson);
  const typeScriptAst = createExpression(intermediate);
  const resultFile = createSourceFile("notExisting.ts", "", ScriptTarget.Latest, false, ScriptKind.TS);
  const printer = createPrinter();
  return printer.printNode(
    EmitHint.Unspecified,
    isDefaultExport ? factory.createExportDefault(typeScriptAst) : typeScriptAst,
    resultFile
  );
}
