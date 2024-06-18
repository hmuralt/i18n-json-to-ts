const i18nJsonToTs = require("./index");

console.log(
  i18nJsonToTs.getTypeScriptFromObject({
    greeting: "Hi",
    notSignedIn: "You're not signed in.",
    signIn: "Sign in",
    notAllowedAccessToFeature: "This feature has not yet been activated for your account.",
    pleaseContactPmOrGetInTouchAt:
      "Please contact your Supertext project manager or get in touch at {email: string} or {phone: string} so we can get you going as quickly as possible.",
  })
);
