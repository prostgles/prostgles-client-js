import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

test("every README code block matches its test fixture", () => {
  const examples = [
    ["bash", "install.sh"],
    ["html", "cdn.html"],
    ["ts", "node.ts"],
    ["tsx", "react.tsx"],
    ["tsx", "sync.tsx"],
  ] as const;
  const sections = readFileSync(resolve(__dirname, "../../README.md"), "utf8").split("```");
  assert.equal(sections.length, examples.length * 2 + 1, "Each code block needs a test fixture");
  examples.forEach(([language, filename], index) => {
    const example = readFileSync(resolve(__dirname, "../readme", filename), "utf8").trim();
    assert.equal(sections[index * 2 + 1]?.trim(), `${language}\n${example}`, filename);
  });
});
