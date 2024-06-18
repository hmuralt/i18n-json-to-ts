import {
  isObjectLiteralExpression,
  isLiteralExpression,
  ObjectLiteralExpression,
  isArrayLiteralExpression,
  ArrayLiteralExpression,
  isArrowFunction,
  Identifier,
  PropertyAssignment,
  ArrowFunction,
  SyntaxKind,
  factory,
  isBlock,
  Block,
  isReturnStatement,
  ReturnStatement,
  isIfStatement,
  IfStatement,
  isStringLiteral,
  StringLiteral,
  isBinaryExpression,
  BinaryExpression,
  NumericLiteral,
} from "typescript";
import createExpression from "../../src/IntermediateToTypeScript/ExpressionCreation";
import {
  ObjectValueDescription,
  ValueDescriptionType,
  PrimitiveValueDescription,
  ArrayValueDescription,
  ValueDescription,
  PlaceholderFunctionValueDescription,
  ArgType,
  PluralFunctionValueDescription,
  BooleanFunctionValueDescription,
} from "../../src/Intermediate/IntermediateStructure";
import createParameters from "../../src/IntermediateToTypeScript/ParameterCreation";
import createTemplate from "../../src/IntermediateToTypeScript/TemplateExpressionCreation";
import { pluralFormNthKey } from "../../src/JsonToIntermediate/JsonStructure";

const testParameter = factory.createParameterDeclaration(
  undefined,
  undefined,
  "testParam",
  undefined,
  factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)
);
const testParameters = [testParameter];
jest.mock("../../src/IntermediateToTypeScript/ParameterCreation", () => ({
  default: jest.fn(() => testParameters),
}));
const testTemplateExpression = factory.createTemplateExpression(factory.createTemplateHead("head"), []);
jest.mock("../../src/IntermediateToTypeScript/TemplateExpressionCreation", () => ({
  default: jest.fn(() => testTemplateExpression),
}));

describe("TypeScriptCreation", () => {
  const testPrimitiveDescription: PrimitiveValueDescription = {
    type: ValueDescriptionType.Primitive,
    value: 2355,
  };
  const testArrayDescriptionSimple: ArrayValueDescription = {
    type: ValueDescriptionType.Array,
    valueDescriptions: [],
  };
  const testObjectDescriptionSimple: ObjectValueDescription = {
    type: ValueDescriptionType.Object,
    propertyDescriptions: new Map<string, ValueDescription>(),
  };
  const testPlaceholderFunctionValueDescription: PlaceholderFunctionValueDescription = {
    type: ValueDescriptionType.PlaceholderFunction,
    args: [{ name: "argName", type: ArgType.Number }],
    stringParts: ["Start ", { name: "argName" }, " end"],
  };
  const testPluralFunctionValueDescription: PluralFunctionValueDescription = {
    type: ValueDescriptionType.PluralFunction,
    args: [
      { name: "count", type: ArgType.Number },
      { name: "pluralArg", type: ArgType.Number },
    ],
    values: {
      0: "Zero",
      1: ["One ", { name: "pluralArg" }, { name: "count" }],
      n: ["Multi ", { name: "count" }],
    },
  };
  const testBooleanFunctionValueDescription: BooleanFunctionValueDescription = {
    type: ValueDescriptionType.BooleanFunction,
    args: [
      { name: "boolean", type: ArgType.Boolean },
      { name: "falseArg", type: ArgType.Number },
    ],
    values: {
      true: "True",
      false: ["False", { name: "falseArg" }],
    },
  };
  const testArrayDescription: ArrayValueDescription = {
    type: ValueDescriptionType.Array,
    valueDescriptions: [
      testPrimitiveDescription,
      testArrayDescriptionSimple,
      testObjectDescriptionSimple,
      testPlaceholderFunctionValueDescription,
      testPluralFunctionValueDescription,
    ],
  };
  const testObjectDescription: ObjectValueDescription = {
    type: ValueDescriptionType.Object,
    propertyDescriptions: new Map<string, ValueDescription>([
      ["primitiveKey", testPrimitiveDescription],
      ["arrayKey", testArrayDescription],
      ["objectKey", testObjectDescriptionSimple],
      ["placeholderFunctionKey", testPlaceholderFunctionValueDescription],
      ["pluralFunctionKey", testPluralFunctionValueDescription],
    ]),
  };

  const testObjectWithSpecialPropertiesDescription: ObjectValueDescription = {
    type: ValueDescriptionType.Object,
    propertyDescriptions: new Map<string, ValueDescription>([["special-key", testPrimitiveDescription]]),
  };

  describe("createExpression", () => {
    describe("when passed PrimitiveValueDescription", () => {
      it("returns literal expression", () => {
        // Arrange

        // Act
        const result = createExpression(testPrimitiveDescription);

        // Assert
        expect(isLiteralExpression(result)).toBe(true);
      });
    });

    describe("when passed ArrayValueDescription", () => {
      it("returns array literal expression", () => {
        // Arrange

        // Act
        const result = createExpression(testArrayDescription);

        // Assert
        expect(isArrayLiteralExpression(result)).toBe(true);
      });

      it("handles arrays value descriptions", () => {
        // Arrange

        // Act
        const result = createExpression(testArrayDescription) as ArrayLiteralExpression;

        // Assert
        expect(result.elements.length).toBe(5);
        expect(isLiteralExpression(result.elements[0])).toBe(true);
        expect(isArrayLiteralExpression(result.elements[1])).toBe(true);
        expect(isObjectLiteralExpression(result.elements[2])).toBe(true);
        expect(isArrowFunction(result.elements[3])).toBe(true);
        expect(isArrowFunction(result.elements[4])).toBe(true);
      });
    });

    describe("when passed ObjectValueDescription", () => {
      it("returns object literal expression", () => {
        // Arrange
        // Act
        const result = createExpression(testObjectDescription);

        // Assert
        expect(isObjectLiteralExpression(result)).toBe(true);
      });

      it("returns object literal expression with property assignments", () => {
        // Arrange
        const keys = Array.from(testObjectDescription.propertyDescriptions.keys());

        // Act
        const result = createExpression(testObjectDescription) as ObjectLiteralExpression;

        // Assert (simple but expects order being maintained)
        expect(result.properties.length).toBe(5);
        expect((result.properties[0].name as Identifier).escapedText).toBe(keys[0]);
        expect(isLiteralExpression((result.properties[0] as PropertyAssignment).initializer)).toBe(true);
        expect((result.properties[1].name as Identifier).escapedText).toBe(keys[1]);
        expect(isArrayLiteralExpression((result.properties[1] as PropertyAssignment).initializer)).toBe(true);
        expect((result.properties[2].name as Identifier).escapedText).toBe(keys[2]);
        expect(isObjectLiteralExpression((result.properties[2] as PropertyAssignment).initializer)).toBe(true);
        expect((result.properties[3].name as Identifier).escapedText).toBe(keys[3]);
        expect(isArrowFunction((result.properties[3] as PropertyAssignment).initializer)).toBe(true);
        expect((result.properties[4].name as Identifier).escapedText).toBe(keys[4]);
        expect(isArrowFunction((result.properties[4] as PropertyAssignment).initializer)).toBe(true);
      });

      it("uses string literal property names when key not valid as identifier", () => {
        // Arrange
        // Act
        const result = createExpression(testObjectWithSpecialPropertiesDescription) as ObjectLiteralExpression;

        expect(result.properties[0].name!.kind).toBe(SyntaxKind.StringLiteral);
      });
    });

    describe("when passed PlaceholderFunctionValueDescription", () => {
      beforeEach(() => {
        (createParameters as jest.Mock).mockClear();
        (createTemplate as jest.Mock).mockClear();
      });

      it("returns arrow function", () => {
        // Arrange

        // Act
        const result = createExpression(testPlaceholderFunctionValueDescription);

        // Assert
        expect(isArrowFunction(result)).toBe(true);
      });

      it("returns arrow function with arguments", () => {
        // Arrange

        // Act
        const result = createExpression(testPlaceholderFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(createParameters).toHaveBeenCalledWith(testPlaceholderFunctionValueDescription.args);
        expect(result.parameters[0]).toBe(testParameters[0]);
      });

      it("returns arrow function with template expression", () => {
        // Arrange

        // Act
        const result = createExpression(testPlaceholderFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(createTemplate).toHaveBeenCalledWith(testPlaceholderFunctionValueDescription.stringParts);
        expect(result.body).toBe(testTemplateExpression);
      });
    });

    describe("when passed PluralFunctionValueDescription", () => {
      beforeEach(() => {
        (createParameters as jest.Mock).mockClear();
        (createTemplate as jest.Mock).mockClear();
      });

      it("returns arrow function", () => {
        // Arrange

        // Act
        const result = createExpression(testPluralFunctionValueDescription);

        // Assert
        expect(isArrowFunction(result)).toBe(true);
      });

      it("returns arrow function with arguments", () => {
        // Arrange

        // Act
        const result = createExpression(testPluralFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(createParameters).toHaveBeenCalledWith(testPluralFunctionValueDescription.args);
        expect(result.parameters[0]).toBe(testParameters[0]);
      });

      it("returns arrow function with block as body", () => {
        // Arrange

        // Act
        const result = createExpression(testPluralFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(isBlock(result.body)).toBe(true);
      });

      it("returns arrow function with block returning nth value per default", () => {
        // Arrange

        // Act
        const result = (createExpression(testPluralFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isReturnStatement(result.statements[result.statements.length - 1])).toBe(true);
        expect(createTemplate).toHaveBeenCalledWith(testPluralFunctionValueDescription.values[pluralFormNthKey]);
        expect((result.statements[result.statements.length - 1] as ReturnStatement).expression).toBe(
          testTemplateExpression
        );
      });

      it("returns arrow function with block containing if block returning value of 0", () => {
        // Arrange

        // Act
        const result = (createExpression(testPluralFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[0])).toBe(true);
        expect(isBlock((result.statements[0] as IfStatement).thenStatement)).toBe(true);
        expect(isReturnStatement(((result.statements[0] as IfStatement).thenStatement as Block).statements[0])).toBe(
          true
        );
        expect(
          isStringLiteral(
            (((result.statements[0] as IfStatement).thenStatement as Block).statements[0] as ReturnStatement)
              .expression!
          )
        ).toBe(true);
        expect(
          (
            (((result.statements[0] as IfStatement).thenStatement as Block).statements[0] as ReturnStatement)
              .expression as StringLiteral
          ).text
        ).toBe(testPluralFunctionValueDescription.values[0]);
      });

      it("returns arrow function with block containing if block checking for 0", () => {
        // Arrange

        // Act
        const result = (createExpression(testPluralFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[0])).toBe(true);
        expect(isBinaryExpression((result.statements[0] as IfStatement).expression)).toBe(true);
        expect(
          (((result.statements[0] as IfStatement).expression as BinaryExpression).left as Identifier).escapedText
        ).toBe("count");
        expect(
          (((result.statements[0] as IfStatement).expression as BinaryExpression).right as NumericLiteral).text
        ).toBe("0");
        expect(((result.statements[0] as IfStatement).expression as BinaryExpression).operatorToken.kind).toBe(
          SyntaxKind.EqualsEqualsEqualsToken
        );
      });

      it("returns arrow function with block containing if block returning value of 1", () => {
        // Arrange

        // Act
        const result = (createExpression(testPluralFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[1])).toBe(true);
        expect(isBlock((result.statements[1] as IfStatement).thenStatement)).toBe(true);
        expect(isReturnStatement(((result.statements[1] as IfStatement).thenStatement as Block).statements[0])).toBe(
          true
        );
        expect(
          (((result.statements[1] as IfStatement).thenStatement as Block).statements[0] as ReturnStatement).expression
        ).toBe(testTemplateExpression);
        expect(createTemplate).toHaveBeenCalledWith(testPluralFunctionValueDescription.values["1"]);
      });

      it("returns arrow function with block containing if block checking for 1", () => {
        // Arrange

        // Act
        const result = (createExpression(testPluralFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[1])).toBe(true);
        expect(isBinaryExpression((result.statements[1] as IfStatement).expression)).toBe(true);
        expect(
          (((result.statements[1] as IfStatement).expression as BinaryExpression).left as Identifier).escapedText
        ).toBe("count");
        expect(
          (((result.statements[1] as IfStatement).expression as BinaryExpression).right as NumericLiteral).text
        ).toBe("1");
        expect(((result.statements[1] as IfStatement).expression as BinaryExpression).operatorToken.kind).toBe(
          SyntaxKind.EqualsEqualsEqualsToken
        );
      });
    });
    describe("when passed BooleanFunctionValueDescription", () => {
      beforeEach(() => {
        (createParameters as jest.Mock).mockClear();
        (createTemplate as jest.Mock).mockClear();
      });

      it("returns arrow function", () => {
        // Arrange

        // Act
        const result = createExpression(testBooleanFunctionValueDescription);

        // Assert
        expect(isArrowFunction(result)).toBe(true);
      });

      it("returns arrow function with arguments", () => {
        // Arrange

        // Act
        const result = createExpression(testBooleanFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(createParameters).toHaveBeenCalledWith(testBooleanFunctionValueDescription.args);
        expect(result.parameters[0]).toBe(testParameters[0]);
      });

      it("returns arrow function with block as body", () => {
        // Arrange

        // Act
        const result = createExpression(testBooleanFunctionValueDescription) as ArrowFunction;

        // Assert
        expect(isBlock(result.body)).toBe(true);
      });

      it("returns arrow function with block containing if else block returning value of true/false", () => {
        // Arrange

        // Act
        const result = (createExpression(testBooleanFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[0])).toBe(true);
        expect(isBlock((result.statements[0] as IfStatement).thenStatement)).toBe(true);
        expect((result.statements[0] as IfStatement).elseStatement !== undefined).toBe(true);
        expect(isBlock((result.statements[0] as IfStatement).elseStatement!)).toBe(true);

        expect(isReturnStatement(((result.statements[0] as IfStatement).thenStatement as Block).statements[0])).toBe(
          true
        );
        expect(
          isStringLiteral(
            (((result.statements[0] as IfStatement).thenStatement as Block).statements[0] as ReturnStatement)
              .expression!
          )
        ).toBe(true);
        expect(
          (
            (((result.statements[0] as IfStatement).thenStatement as Block).statements[0] as ReturnStatement)
              .expression as StringLiteral
          ).text
        ).toBe(testBooleanFunctionValueDescription.values["true"]);

        expect(isReturnStatement(((result.statements[0] as IfStatement).elseStatement as Block).statements[0])).toBe(
          true
        );
        expect(
          isStringLiteral(
            (((result.statements[0] as IfStatement).elseStatement as Block).statements[0] as ReturnStatement)
              .expression!
          )
        ).toBe(true);
        expect(
          (
            (((result.statements[0] as IfStatement).elseStatement as Block).statements[0] as ReturnStatement)
              .expression as StringLiteral
          ).text
        ).toBe(testBooleanFunctionValueDescription.values["false"]);
      });

      it("returns arrow function with block containing if block checking for true", () => {
        // Arrange

        // Act
        const result = (createExpression(testBooleanFunctionValueDescription) as ArrowFunction).body as Block;

        // Assert
        expect(isIfStatement(result.statements[0])).toBe(true);
        expect(isBinaryExpression((result.statements[0] as IfStatement).expression)).toBe(true);
        expect(
          (((result.statements[0] as IfStatement).expression as BinaryExpression).left as Identifier).escapedText
        ).toBe("boolean");
        expect(((result.statements[0] as IfStatement).expression as BinaryExpression).right.kind).toBe(
          SyntaxKind.TrueKeyword
        );
        expect(((result.statements[0] as IfStatement).expression as BinaryExpression).operatorToken.kind).toBe(
          SyntaxKind.EqualsEqualsEqualsToken
        );
      });
    });
  });
});
