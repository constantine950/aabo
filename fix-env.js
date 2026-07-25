const fs = require("fs");
const at = String.fromCharCode(64);
const url = `postgresql://user:password${at}localhost:5432/aabo`;
const content = fs.readFileSync(".env", "utf8");
const fixed = content.replace(/DATABASE_URL=.*/, `DATABASE_URL=${url}`);
fs.writeFileSync(".env", fixed);
console.log("done:", url);
