import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(js|mjs)$/.test(entry.name)) files.push(path);
  }
}

await walk("src");
await walk("scripts");
await walk("tests");
for (const file of files) {
  const source = await readFile(file, "utf8");
  if (/console\.log\(/.test(source) && !file.endsWith("build_dashboard_data.py")) {
    throw new Error(`Unexpected console.log in ${file}`);
  }
  if (/\t/.test(source)) throw new Error(`Tab indentation found in ${file}`);
}
console.info(`Checked ${files.length} JavaScript files.`);
