import { PropertyAssignment, SyntaxKind, Expression, Statement, factory } from "typescript";
import {
  ObjectValueDescription,
  ValueDescription,
  isObjectValueDescription,
  isPrimitiveValueDescription,
  PrimitiveValueDescription,
  isArrayValueDescription,
  ArrayValueDescription,
  PlaceholderFunctionValueDescription,
  isPlaceholderFunctionValueDescription,
  isPluralFunctionValueDescription,
  PluralFunctionValueDescription,
  StringPart,
  PluralFormObjectDescription,
  isBooleanFunctionValueDescription,
  BooleanFunctionValueDescription,
} from "../Intermediate/IntermediateStructure";
import { booleanFormFalseKey, booleanFormTrueKey, pluralFormNthKey } from "../JsonToIntermediate/JsonStructure";
import createParameters from "./ParameterCreation";
import createTemplate from "./TemplateExpressionCreation";

const properteyKeyIdentifierRegex = /^(?!\d)[\w$]+$/;

export default function createExpression(valueDescription: ValueDescription): Expression {
  if (isPrimitiveValueDescription(valueDescription)) {
    return createValue(valueDescription);
  }

  if (isArrayValueDescription(valueDescription)) {
    return createArray(valueDescription);
  }

  if (isObjectValueDescription(valueDescription)) {
    return createObject(valueDescription);
  }

  if (isPlaceholderFunctionValueDescription(valueDescription)) {
    return createPlaceholderFunction(valueDescription);
  }

  if (isPluralFunctionValueDescription(valueDescription)) {
    return createPluralFunction(valueDescription);
  }

  if (isBooleanFunctionValueDescription(valueDescription)) {
    return createBooleanFunction(valueDescription);
  }

  return factory.createStringLiteral("");
}

function createValue(valueDescription: PrimitiveValueDescription) {
  if (typeof valueDescription.value === "number") {
    return factory.createNumericLiteral(valueDescription.value);
  }

  return factory.createStringLiteral(valueDescription.value.toString());
}

function createArray(valueDescription: ArrayValueDescription) {
  const expressions = valueDescription.valueDescriptions.map((currentValueDescription) =>
    createExpression(currentValueDescription)
  );

  return factory.createArrayLiteralExpression(expressions);
}

function createObject(objectValueDescription: ObjectValueDescription) {
  const propertyAssignments = new Array<PropertyAssignment>();

  for (const [key, valueDescription] of objectValueDescription.propertyDescriptions) {
    const name = properteyKeyIdentifierRegex.test(key) ? key : factory.createStringLiteral(key);

    propertyAssignments.push(factory.createPropertyAssignment(name, createExpression(valueDescription)));
  }

  return factory.createObjectLiteralExpression(propertyAssignments);
}

function createPlaceholderFunction(valueDescription: PlaceholderFunctionValueDescription) {
  const parameters = createParameters(valueDescription.args);

  const templateExpression = createTemplate(valueDescription.stringParts);

  return factory.createArrowFunction(undefined, undefined, parameters, undefined, undefined, templateExpression);
}

function createPluralFunction(valueDescription: PluralFunctionValueDescription) {
  const parameters = createParameters(valueDescription.args);

  const statements = createPluralStatements(valueDescription.values);

  const block = factory.createBlock(statements, false);

  return factory.createArrowFunction(undefined, undefined, parameters, undefined, undefined, block);
}

function createBooleanFunction(valueDescription: BooleanFunctionValueDescription) {
  const parameters = createParameters(valueDescription.args);

  const conditionalReturn = createBooleanConditionalReturn(
    valueDescription.values[booleanFormTrueKey],
    valueDescription.values[booleanFormFalseKey]
  );

  const block = factory.createBlock([conditionalReturn], false);

  return factory.createArrowFunction(undefined, undefined, parameters, undefined, undefined, block);
}

function createPluralStatements(values: PluralFormObjectDescription) {
  const valueKeys = Object.keys(values);

  const statements: Statement[] = valueKeys
    .filter((valueKey) => valueKey !== pluralFormNthKey)
    .map((valueKey) => {
      const value = values[valueKey as keyof typeof values];

      return createPluralIfBlock(valueKey, value);
    });

  const nthValue = values[pluralFormNthKey];

  statements.push(createPluralValueReturn(nthValue));

  return statements;
}

function createPluralIfBlock(valueKey: string, value: string | StringPart) {
  const condition = factory.createBinaryExpression(
    factory.createIdentifier("count"),
    SyntaxKind.EqualsEqualsEqualsToken,
    factory.createNumericLiteral(parseInt(valueKey, 10))
  );

  const ifBody = factory.createBlock([createPluralValueReturn(value)], false);

  return factory.createIfStatement(condition, ifBody);
}

function createPluralValueReturn(stringPart: string | StringPart) {
  return factory.createReturnStatement(createValueString(stringPart));
}

function createValueString(stringPart: string | StringPart) {
  return typeof stringPart === "string" ? factory.createStringLiteral(stringPart) : createTemplate(stringPart);
}

function createBooleanConditionalReturn(trueValue: string | StringPart, falseValue: string | StringPart) {
  return factory.createReturnStatement(
    factory.createConditionalExpression(
      factory.createIdentifier("bool"),
      undefined,
      createValueString(trueValue),
      undefined,
      createValueString(falseValue)
    )
  );
}
