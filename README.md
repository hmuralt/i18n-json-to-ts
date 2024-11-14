# i18n JSON to TypeScript

Utility to generate TypeScript out of a translatable I18N JSON. (using TypeScript compiler API)

Note: this is not a tool that maps JSON to TypeScript one to one.

## Example

JSON

```JSON
{
	"exampleText": "This is an example text.",
	"placeholderText": "This example says {helloMessage: string} to you!",
	"pluralTexts": {
		"0": "No example tags here.",
		"1": "There is one example tag with name {name: string}.",
		"n": "There are {count: number} example tags with name {name: string}."
	},
	"booleanTexts": {
		"true": "The bool is true",
		"false": "The bool is false"
	}
}
```

Resulting TypeScript

```TypeScript
{
	exampleText: "This is an example text.",
	placeholderText: (helloMessage: string) => `This example says ${helloMessage} to you!`,
	pluralTexts: (count: number, name: string) => {
		if (count === 0) {
			return "No example tags here.";
		}
		if (count === 1) {
			return `There is one example tag with name ${name}.`;
		}
		return `There are ${count} example tags with name ${name}.`;
	},
	booleanTexts: (bool: boolean) => {
		return bool ? "The bool is true" : "The bool is false"
	}
}
```

Call

```TypeScript
getTypeScriptFromString(`{
  "exampleText": "This is an example text.",
  "placeholderText": "This example says {helloMessage: string} to you!",
  "pluralTexts": {
    "0": "No example tags here.",
    "1": "There is one example tag with name {name: string}.",
    "n": "There are {count: number} example tags with name {name: string}."
  },
  "booleanTexts": {
    "true": "The bool is true",
    "false": "The bool is false"
  }
}`);
```
