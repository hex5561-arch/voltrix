import fs from "node:fs";

const log = fs.readFileSync("/home/voltrix/.gemini/antigravity-cli/brain/232cae3f-2ba2-4c28-873b-b0a5e884752f/.system_generated/tasks/task-12584.log", "utf8");
const jsonMatch = log.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  const data = JSON.parse(jsonMatch[0]);
  console.log("FULL SRCDOC:\n", data.srcdoc);
}
