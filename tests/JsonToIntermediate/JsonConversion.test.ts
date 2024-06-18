/* eslint-disable @typescript-eslint/no-non-null-assertion */
import convertObject from "../../src/JsonToIntermediate/JsonConversion";
import {
  ArgType,
  isObjectValueDescription,
  ValueDescription,
  isPlaceholderFunctionValueDescription,
  isPluralFunctionValueDescription,
  isArrayValueDescription,
  isPrimitiveValueDescription,
  ValueDescriptionType,
  isBooleanFunctionValueDescription,
} from "../../src/Intermediate/IntermediateStructure";

describe("JsonConversion", () => {
  describe("convertJson", () => {
    describe("when converting primitive properties", () => {
      function primitiveValueDescriptionTest(testPropertyValue: unknown) {
        // Arrange
        const testPropertyName = "myNoneStringProp";
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const noneStringValueDescription = getAs(
          isPrimitiveValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(noneStringValueDescription.value).toEqual(testPropertyValue);
      }

      it("converts string property to PrimitiveValueDescription", () => primitiveValueDescriptionTest("test string"));
      it("converts number property to PrimitiveValueDescription", () => primitiveValueDescriptionTest(23236));
      it("converts boolean property to PrimitiveValueDescription", () => primitiveValueDescriptionTest(true));
    });

    describe("when converting string properties", () => {
      it("converts string with placeholders to PlaceholderFunctionValueDescription", () => {
        // Arrange
        const testPropertyName = "myStringProp";
        const testPlaceholderName = "adj";
        const testPlaceholderType = "string";
        const testPropertyValue = `This is a test with a {${testPlaceholderName}: ${testPlaceholderType}} placeholder.`;
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const placeholderFunctionValueDescription = getAs(
          isPlaceholderFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(placeholderFunctionValueDescription.args).toEqual([
          {
            name: testPlaceholderName,
            type: ArgType.String,
          },
        ]);
        expect(placeholderFunctionValueDescription.stringParts).toEqual([
          "This is a test with a ",
          {
            name: testPlaceholderName,
          },
          " placeholder.",
        ]);
      });

      it("converts string with placeholders at the start to correct string template", () => {
        // Arrange
        const testPropertyName = "myStringProp";
        const testPlaceholderName = "adj";
        const testPlaceholderType = "string";
        const testPropertyValue = `{${testPlaceholderName}: ${testPlaceholderType}} placeholder.`;
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const placeholderFunctionValueDescription = getAs(
          isPlaceholderFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(placeholderFunctionValueDescription.stringParts).toEqual([
          {
            name: testPlaceholderName,
          },
          " placeholder.",
        ]);
      });

      it("converts string with placeholders at the start to correct string template", () => {
        // Arrange
        const testPropertyName = "myStringProp";
        const testPlaceholderName = "adj";
        const testPlaceholderType = "string";
        const testPropertyValue = `it begins with {${testPlaceholderName}: ${testPlaceholderType}}`;
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const placeholderFunctionValueDescription = getAs(
          isPlaceholderFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(placeholderFunctionValueDescription.stringParts).toEqual([
          "it begins with ",
          {
            name: testPlaceholderName,
          },
        ]);
      });

      it("converts string with unkown placeholders type per default to string", () => {
        // Arrange
        const testPropertyName = "myStringProp";
        const testPlaceholderName = "adj";
        const testPlaceholderType = "foo";
        const testPropertyValue = `{${testPlaceholderName}: ${testPlaceholderType}}`;
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const placeholderFunctionValueDescription = getAs(
          isPlaceholderFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(placeholderFunctionValueDescription.args).toEqual([
          {
            name: testPlaceholderName,
            type: ArgType.String,
          },
        ]);
        expect(placeholderFunctionValueDescription.stringParts).toEqual([
          {
            name: testPlaceholderName,
          },
        ]);
      });

      it("lists a placeholder appearing multiple times in string just once", () => {
        // Arrange
        const testPropertyName = "myStringProp";
        const testPlaceholderName = "adj";
        const testPlaceholderType = "foo";
        const testPropertyValue = `1: {${testPlaceholderName}: ${testPlaceholderType}}, 2: {${testPlaceholderName}: ${testPlaceholderType}}.`;
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const placeholderFunctionValueDescription = getAs(
          isPlaceholderFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(placeholderFunctionValueDescription.args).toEqual([
          {
            name: testPlaceholderName,
            type: ArgType.String,
          },
        ]);
      });
    });

    describe("when converting object properties", () => {
      it("converts to ObjectValueDescription", () => {
        // Arrange
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {};
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const innerObjectValueDescription = getAs(
          isObjectValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(innerObjectValueDescription.propertyDescriptions).toEqual(new Map());
      });

      it("converts properties of the object", () => {
        // Arrange
        const testInnerPrimitivtePropertyName = "myPrimitiveProp";
        const testInnerStringPropertyName = "myStringProp";
        const testInnerPlaceholderPropertyName = "myPlaceholderProp";
        const testInnerArrayPropertyName = "myArrayProp";
        const testInnerPluralFormPropertyName = "myPluralFormProp";
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {
          [testInnerPrimitivtePropertyName]: 42,
          [testInnerStringPropertyName]: "This is a test value",
          [testInnerPlaceholderPropertyName]: "This is {param1: number} placeholder",
          [testInnerArrayPropertyName]: [],
          [testInnerPluralFormPropertyName]: { 0: "zero", 1: "one", n: "many" },
        };
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const innerObjectValueDescription = getAs(
          isObjectValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        const innerPropertyDescriptions = innerObjectValueDescription.propertyDescriptions;
        expect(innerPropertyDescriptions.get(testInnerPrimitivtePropertyName)!.type).toBe(
          ValueDescriptionType.Primitive
        );
        expect(innerPropertyDescriptions.get(testInnerStringPropertyName)!.type).toBe(ValueDescriptionType.Primitive);
        expect(innerPropertyDescriptions.get(testInnerPlaceholderPropertyName)!.type).toBe(
          ValueDescriptionType.PlaceholderFunction
        );
        expect(innerPropertyDescriptions.get(testInnerArrayPropertyName)!.type).toBe(ValueDescriptionType.Array);
        expect(innerPropertyDescriptions.get(testInnerPluralFormPropertyName)!.type).toBe(
          ValueDescriptionType.PluralFunction
        );
      });

      it("converts plural form objects to PluralFunctionValueDescription", () => {
        // Arrange
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {
          0: "No tests",
          1: "One test",
          n: "{count: number} tests",
        };
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const pluralFunctionValueDescription = getAs(
          isPluralFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(pluralFunctionValueDescription.args).toEqual([
          {
            name: "count",
            type: "number",
          },
        ]);
        expect(pluralFunctionValueDescription.values).toEqual({
          0: "No tests",
          1: "One test",
          n: [
            {
              name: "count",
            },
            " tests",
          ],
        });
      });

      it("adds all args of the plural form objects property values", () => {
        // Arrange
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {
          0: "No { somePlaceholder: object } tests",
          1: "One { anotherPlaceholder: string } test",
          n: "{count: number} tests",
        };
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const pluralFunctionValueDescription = getAs(
          isPluralFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(pluralFunctionValueDescription.args).toEqual([
          {
            name: "count",
            type: "number",
          },
          {
            name: "somePlaceholder",
            type: "object",
          },
          {
            name: "anotherPlaceholder",
            type: "string",
          },
        ]);
      });

      it("converts boolean form objects to BooleanFunctionValueDescription", () => {
        // Arrange
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {
          true: "test is true",
          false: "test is false",
        };
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const booleanFunctionValueDescription = getAs(
          isBooleanFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(booleanFunctionValueDescription.args).toEqual([
          {
            name: "bool",
            type: "boolean",
          },
        ]);
        expect(booleanFunctionValueDescription.values).toEqual({
          true: "test is true",
          false: "test is false",
        });
      });

      it("adds all args of the boolean form objects property values", () => {
        // Arrange
        const testPropertyName = "myObjectProp";
        const testPropertyValue = {
          true: "{ somePlaceholder: object } is true",
          false: "{ anotherPlaceholder: string } is false",
        };
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const booleanFunctionValueDescription = getAs(
          isBooleanFunctionValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(booleanFunctionValueDescription.args).toEqual([
          {
            name: "bool",
            type: "boolean",
          },
          {
            name: "somePlaceholder",
            type: "object",
          },
          {
            name: "anotherPlaceholder",
            type: "string",
          },
        ]);
      });
    });

    describe("when converting array properties", () => {
      it("converts to ArrayValueDescription", () => {
        // Arrange
        const testPropertyName = "myArrayProp";
        const testPropertyValue: string[] = [];
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const innerArrayValueDescription = getAs(
          isArrayValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        expect(innerArrayValueDescription.valueDescriptions).toEqual([]);
      });

      it("converts string values", () => {
        // Arrange
        const testPropertyName = "myArrayProp";
        const testPropertyValue = [
          42,
          "This is a test value",
          "This is {param1: number} placeholder",
          [],
          { 0: "zero", 1: "one", n: "many" },
          {},
        ];
        const testJsonObject = {
          [testPropertyName]: testPropertyValue,
        };

        // Act
        const result = convertObject(testJsonObject);

        // Assert
        const objectValueDescription = getAs(isObjectValueDescription, result);
        const innerArrayValueDescription = getAs(
          isArrayValueDescription,
          objectValueDescription.propertyDescriptions.get(testPropertyName)
        );
        const innerValueDescriptions = innerArrayValueDescription.valueDescriptions;
        expect(innerValueDescriptions[0].type).toBe(ValueDescriptionType.Primitive);
        expect(innerValueDescriptions[1].type).toBe(ValueDescriptionType.Primitive);
        expect(innerValueDescriptions[2].type).toBe(ValueDescriptionType.PlaceholderFunction);
        expect(innerValueDescriptions[3].type).toBe(ValueDescriptionType.Array);
        expect(innerValueDescriptions[4].type).toBe(ValueDescriptionType.PluralFunction);
        expect(innerValueDescriptions[5].type).toBe(ValueDescriptionType.Object);
      });
    });
  });
});

function getAs<TValueDescription extends ValueDescription>(
  check: (v: ValueDescription) => v is TValueDescription,
  valueDescription: ValueDescription | undefined
): TValueDescription {
  if (valueDescription === undefined) {
    throw Error("valueDescription is undefined");
  }

  if (!check(valueDescription)) {
    throw Error("Passed valueDescription is not of expected type");
  }

  return valueDescription;
}
