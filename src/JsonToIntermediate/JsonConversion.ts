import {
  ObjectValueDescription,
  PlaceholderFunctionValueDescription,
  StringPart,
  getTypeFrom,
  Arg,
  PluralFunctionValueDescription,
  ArgType,
  ValueDescription,
  ValueDescriptionType,
  isPrimitiveValueDescription,
  PrimitiveValueDescription,
  isPrimitiveStringValueDescription,
  ArrayValueDescription,
  BooleanFunctionValueDescription,
  BooleanFormObjectDescription,
  PluralFormObjectDescription,
} from "../Intermediate/IntermediateStructure";
import { placeholderRegex, getAllMatches } from "./RegexUtils";
import {
  BooleanFormObject,
  PluralFormObject,
  PrimitiveJsonType,
  booleanFormFalseKey,
  booleanFormTrueKey,
  pluralFormNthKey,
} from "./JsonStructure";

export default function convertObject(
  value: object
): ObjectValueDescription | PluralFunctionValueDescription | BooleanFunctionValueDescription {
  return isPluralFormObject(value)
    ? convertPluralFormObject(value)
    : isBooleanFormObject(value)
    ? convertBooleanFormObject(value)
    : convertSimpleObject(value);
}

function convertPluralFormObject(obj: PluralFormObject): PluralFunctionValueDescription {
  const fixedCountArg = { name: "count", type: ArgType.Number };

  const [values, argSet] = Object.keys(obj)
    .filter((key) => key !== pluralFormNthKey)
    .reduce(
      ([values, argSet], key) => {
        const objKey = key as keyof typeof obj;
        const valuesKey = key as keyof PluralFormObjectDescription;
        const valueDescription = convertString(obj[objKey]);

        if (isPrimitiveStringValueDescription(valueDescription)) {
          values[valuesKey] = valueDescription.value;
          return [values, argSet];
        }

        for (const arg of valueDescription.args) {
          argSet.add(arg);
        }

        values[valuesKey] = valueDescription.stringParts;
        return [values, argSet];
      },
      [
        getPluralFunctionValues(obj[pluralFormNthKey]) as PluralFormObjectDescription,
        createArgSet([fixedCountArg]),
      ] as const
    );

  return {
    type: ValueDescriptionType.PluralFunction,
    args: argSet.args,
    values,
  };
}

function getPluralFunctionValues(nthValue: string) {
  const nthValueDescription = convertString(nthValue);

  return isPrimitiveValueDescription(nthValueDescription)
    ? { n: nthValueDescription.value }
    : { n: nthValueDescription.stringParts };
}

function convertBooleanFormObject(obj: BooleanFormObject): BooleanFunctionValueDescription {
  const fixedBoolArg = { name: "bool", type: ArgType.Boolean };
  const [values, argSet] = [booleanFormTrueKey, booleanFormFalseKey].reduce(
    ([values, argSet], key) => {
      const objKey = key as keyof typeof obj;
      const valuesKey = key as keyof BooleanFormObjectDescription;
      const valueDescription = convertString(obj[objKey]);

      if (isPrimitiveStringValueDescription(valueDescription)) {
        values[valuesKey] = valueDescription.value;
        return [values, argSet];
      }

      for (const arg of valueDescription.args) {
        argSet.add(arg);
      }

      values[valuesKey] = valueDescription.stringParts;
      return [values, argSet];
    },
    [{} as BooleanFormObjectDescription, createArgSet([fixedBoolArg])] as const
  );

  return {
    type: ValueDescriptionType.BooleanFunction,
    args: argSet.args,
    values,
  };
}

function convertSimpleObject(obj: object): ObjectValueDescription {
  const propertyDescriptions = new Map<string, ValueDescription>();
  const keys = Object.keys(obj);

  for (const key of keys) {
    const value = obj[key as keyof typeof obj];
    const valueDescription = convertValue(value);

    propertyDescriptions.set(key, valueDescription);
  }

  return {
    type: ValueDescriptionType.Object,
    propertyDescriptions,
  };
}

function convertArray(values: unknown[]): ArrayValueDescription {
  const valueDescriptions = values.map((value) => convertValue(value));

  return {
    type: ValueDescriptionType.Array,
    valueDescriptions,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertValue(value: any) {
  const valueType = typeof value;

  if (valueType === "string") {
    return convertString(value);
  }

  if (Array.isArray(value)) {
    return convertArray(value);
  }

  if (valueType === "object") {
    return convertObject(value);
  }

  return convertPrimitive(value);
}

function convertPrimitive(value: PrimitiveJsonType): PrimitiveValueDescription {
  return {
    type: ValueDescriptionType.Primitive,
    value,
  };
}

function convertString(value: string): PrimitiveValueDescription<string> | PlaceholderFunctionValueDescription {
  const placeholderMatches = Array.from(getAllMatches(value, placeholderRegex));

  return placeholderMatches.length === 0
    ? (convertPrimitive(value) as PrimitiveValueDescription<string>)
    : convertStringToPlaceholderFunction(value, placeholderMatches);
}

function convertStringToPlaceholderFunction(
  value: string,
  placeholderMatches: RegExpExecArray[]
): PlaceholderFunctionValueDescription {
  const argSet = createArgSet();
  const stringPartsBuilder = createStringPartsBuilder(value);

  for (const placeholderMatch of placeholderMatches) {
    const arg = {
      name: placeholderMatch[1],
      type: getTypeFrom(placeholderMatch[2]),
    };

    argSet.add(arg);
    stringPartsBuilder.add(arg, placeholderMatch[0]);
  }

  return {
    type: ValueDescriptionType.PlaceholderFunction,
    args: argSet.args,
    stringParts: stringPartsBuilder.stringPart,
  };
}

function isPluralFormObject(obj: { [pluralFormNthKey]?: string }): obj is PluralFormObject {
  return (
    obj[pluralFormNthKey] !== undefined &&
    Object.keys(obj).every(
      (key) => (key === pluralFormNthKey || /^\d+$/.test(key)) && typeof obj[key as keyof typeof obj] === "string"
    )
  );
}

function isBooleanFormObject(obj: {
  [booleanFormTrueKey]?: string;
  [booleanFormFalseKey]?: string;
}): obj is BooleanFormObject {
  return (
    obj[booleanFormTrueKey] !== undefined &&
    typeof obj[booleanFormTrueKey] === "string" &&
    obj[booleanFormFalseKey] !== undefined &&
    typeof obj[booleanFormFalseKey] === "string"
  );
}

function createArgSet(initialArgs: Arg[] = []) {
  const argMap = new Map<string, Arg>(initialArgs.map((initialArg) => [initialArg.name, initialArg]));

  return {
    add(arg: Arg) {
      if (argMap.has(arg.name)) {
        return;
      }

      argMap.set(arg.name, arg);
    },
    get args() {
      return Array.from(argMap.values());
    },
  };
}

function createStringPartsBuilder(value: string) {
  const stringPart: StringPart = [];
  let unprocessedValue = value;

  return {
    add(arg: Arg, argStringMatch: string) {
      const splitValue = unprocessedValue.split(argStringMatch);
      unprocessedValue = splitValue[1];

      if (splitValue[0] !== "") {
        stringPart.push(splitValue[0]);
      }

      stringPart.push({ name: arg.name });
    },
    get stringPart() {
      if (unprocessedValue !== "") {
        stringPart.push(unprocessedValue);
      }

      return stringPart;
    },
  };
}
