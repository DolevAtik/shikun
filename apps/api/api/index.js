// Vercel function: every request is rewritten here (see vercel.json) and handed
// to the compiled Nest app. Plain JS on purpose — Nest needs tsc's decorator
// metadata, so the app is built by `nest build` and this only requires the output.
module.exports = require("../dist/src/serverless.js").default;
