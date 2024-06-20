import {
  PrimitiveJsonType,
  pluralFormNthKey,
  booleanFormFalseKey,
  booleanFormTrueKey,
} from "../JsonToIntermediate/JsonStructure";

export enum ValueDescriptionType {
  Primitive,
  Object,
  Array,
  PlaceholderFunction,
  PluralFunction,
  BooleanFunction,
}

export interface ValueDescription {
  type: ValueDescriptionType;
}

export interface PrimitiveValueDescription<TPrimitive extends PrimitiveJsonType = PrimitiveJsonType>
  extends ValueDescription {
  type: ValueDescriptionType.Primitive;
  value: TPrimitive;
}

export interface ObjectValueDescription extends ValueDescription {
  type: ValueDescriptionType.Object;
  propertyDescriptions: Map<string, ValueDescription>;
}

export interface ArrayValueDescription extends ValueDescription {
  type: ValueDescriptionType.Array;
  valueDescriptions: ValueDescription[];
}

export enum ArgType {
  String = "string",
  Number = "number",
  Object = "object",
  Boolean = "boolean",
}

export interface Arg {
  name: string;
  type: ArgType;
}

export type ArgName = Pick<Arg, "name">;
export type StringPart = (string | ArgName)[];

export interface PlaceholderFunctionValueDescription extends ValueDescription {
  type: ValueDescriptionType.PlaceholderFunction;
  args: Arg[];
  stringParts: StringPart;
}

export interface PluralFormObjectDescription {
  [count: number]: StringPart | string;
  [pluralFormNthKey]: StringPart | string;
}

export interface BooleanFormObjectDescription {
  [booleanFormFalseKey]: StringPart | string;
  [booleanFormTrueKey]: StringPart | string;
}

export interface PluralFunctionValueDescription extends ValueDescription {
  type: ValueDescriptionType.PluralFunction;
  args: Arg[];
  values: PluralFormObjectDescription;
}

export interface BooleanFunctionValueDescription extends ValueDescription {
  type: ValueDescriptionType.BooleanFunction;
  args: Arg[];
  values: BooleanFormObjectDescription;
}

const reverseArgType = new Map(Object.entries(ArgType).map(([key, value]) => [value, key]));

export function getTypeFrom(typeName: string): ArgType {
  const argTypeKey = reverseArgType.get(typeName as ArgType) as keyof typeof ArgType | undefined;

  return argTypeKey !== undefined ? ArgType[argTypeKey] : ArgType.String;
}

export function isPrimitiveValueDescription(
  valueDescription: ValueDescription
): valueDescription is PrimitiveValueDescription {
  return valueDescription.type === ValueDescriptionType.Primitive;
}

export function isPrimitiveStringValueDescription(
  valueDescription: ValueDescription
): valueDescription is PrimitiveValueDescription<string> {
  return (
    valueDescription.type === ValueDescriptionType.Primitive &&
    typeof (valueDescription as PrimitiveValueDescription).value === "string"
  );
}

export function isObjectValueDescription(
  valueDescription: ValueDescription
): valueDescription is ObjectValueDescription {
  return valueDescription.type === ValueDescriptionType.Object;
}

export function isPlaceholderFunctionValueDescription(
  valueDescription: ValueDescription
): valueDescription is PlaceholderFunctionValueDescription {
  return valueDescription.type === ValueDescriptionType.PlaceholderFunction;
}

export function isArrayValueDescription(valueDescription: ValueDescription): valueDescription is ArrayValueDescription {
  return valueDescription.type === ValueDescriptionType.Array;
}

export function isPluralFunctionValueDescription(
  valueDescription: ValueDescription
): valueDescription is PluralFunctionValueDescription {
  return valueDescription.type === ValueDescriptionType.PluralFunction;
}

export function isBooleanFunctionValueDescription(
  valueDescription: ValueDescription
): valueDescription is BooleanFunctionValueDescription {
  return valueDescription.type === ValueDescriptionType.BooleanFunction;
}
