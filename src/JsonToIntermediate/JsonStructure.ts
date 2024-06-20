export type PrimitiveJsonType = boolean | number | string;

export const pluralFormNthKey = "n";

export const booleanFormTrueKey = "true";
export const booleanFormFalseKey = "false";

export interface PluralFormObject {
  [count: number]: string;
  [pluralFormNthKey]: string;
}

export interface BooleanFormObject {
  boolean: boolean;
  stringParts: string;
}
