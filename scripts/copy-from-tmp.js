const { readFileSync } = require("fs");
const content = readFileSync("/tmp/jurassicAIData.ts", "utf-8");
console.log(content);
