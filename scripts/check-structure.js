const fs = require("fs");
const path = require("path");

console.log("🔍 Checking your project structure...");
console.log("Current directory:", process.cwd());
console.log("\n📁 Directory contents:");

// List all directories in current folder
const items = fs.readdirSync(".", { withFileTypes: true });
const directories = items
  .filter((item) => item.isDirectory())
  .map((item) => item.name);
const files = items.filter((item) => item.isFile()).map((item) => item.name);

console.log("\n📂 Directories found:");
directories.forEach((dir) => console.log(`  - ${dir}/`));

console.log("\n📄 Files found:");
files.forEach((file) => console.log(`  - ${file}`));

// Check for common microservice patterns
const possibleServiceDirs = directories.filter(
  (dir) =>
    dir.includes("service") ||
    dir.includes("gateway") ||
    dir.includes("api") ||
    dir === "order" ||
    dir === "payment" ||
    dir === "notification" ||
    dir === "user" ||
    dir === "admin"
);

console.log("\n🎯 Possible service directories:");
if (possibleServiceDirs.length > 0) {
  possibleServiceDirs.forEach((dir) => console.log(`  - ${dir}/`));
} else {
  console.log("  No obvious service directories found");
}

// Check if this might be a single service or different structure
console.log("\n🔍 Analysis:");
if (directories.includes("src")) {
  console.log("  ✅ Found 'src' directory - this might be a single service");
}
if (files.includes("package.json")) {
  console.log("  ✅ Found package.json");
}
if (files.includes("nest-cli.json")) {
  console.log("  ✅ Found nest-cli.json - this is a NestJS project");
}

console.log("\n💡 Recommendations:");
console.log(
  "1. If this is a monorepo with different folder names, we'll create a custom setup"
);
console.log(
  "2. If this is a single service, we'll create a single-service Railway config"
);
console.log(
  "3. Please share your actual folder structure so we can create the right setup"
);
