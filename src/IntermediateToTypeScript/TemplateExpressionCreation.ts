import { StringPart } from "../Intermediate/IntermediateStructure";
import { factory, TemplateSpan } from "typescript";

export default function createTemplate(stringParts: StringPart) {
  const firstPart = typeof stringParts[0] === "string" ? (stringParts[0] as string) : "";
  const templateHead = factory.createTemplateHead(firstPart);

  const templateSpans = stringParts
    .map((part, index) => {
      if (typeof part === "string") {
        return undefined;
      }

      const nextPart = stringParts[index + 1];

      let nextText = "";
      if (typeof nextPart === "string") {
        nextText = nextPart;
      }

      let templateMiddelOrTail;
      if (index === stringParts.length - 1 || index === stringParts.length - 2) {
        templateMiddelOrTail = factory.createTemplateTail(nextText);
      } else {
        templateMiddelOrTail = factory.createTemplateMiddle(nextText);
      }

      return factory.createTemplateSpan(factory.createIdentifier(part.name), templateMiddelOrTail);
    })
    .filter((templateSpan) => templateSpan !== undefined) as TemplateSpan[];

  return factory.createTemplateExpression(templateHead, templateSpans);
}
