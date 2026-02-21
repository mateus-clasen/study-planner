const { pathToRegexp } = require("path-to-regexp");
const r = pathToRegexp("/dashboard/:path*");
console.log(r.test("/dashboard"));
console.log(r.test("/dashboard/"));
