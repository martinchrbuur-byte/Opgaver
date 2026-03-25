#!/usr/bin/env node

import { spawn } from "child_process";
import readline from "readline";

const serverProcess = spawn("node", ["build/index.js"], {
  env: {
    ...process.env,
    ATLASSIAN_DOMAIN: "martinchrbuur.atlassian.net",
    ATLASSIAN_API_TOKEN:
      "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57",
    ATLASSIAN_USER_EMAIL: "martin.chr.buur@gmail.com",
  },
});

let requestId = 1;
let state = "list-projects"; // list-projects -> create-story
let projectKey = null;

const rl = readline.createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  try {
    const response = JSON.parse(line);

    if (state === "list-projects" && response.result) {
      const contentText = response.result.content[0].text;
      const projects = JSON.parse(contentText);

      console.log(`✅ Found ${projects.length} project(s):`);
      projects.forEach((project) => {
        console.log(`  - ${project.key}: ${project.name}`);
      });

      projectKey = projects[0].key;
      console.log(`\n📝 Creating story in project: ${projectKey}\n`);
      state = "create-story";

      // Send create issue request
      const createRequest = {
        jsonrpc: "2.0",
        id: ++requestId,
        method: "tools/call",
        params: {
          name: "create_issue",
          arguments: {
            projectKey: projectKey,
            summary: "Test Story",
            issueType: "Story",
            description:
              "This is a test story created via MCP server integration",
            priority: "Medium",
          },
        },
      };

      console.log("Sending create_issue request...");
      serverProcess.stdin.write(JSON.stringify(createRequest) + "\n");
    } else if (state === "create-story" && response.result) {
      if (response.result.isError) {
        console.error("❌ Error creating issue:");
        console.error(response.result.content[0].text);
        serverProcess.kill();
        process.exit(1);
      }

      const contentText = response.result.content[0].text;
      const issueData = JSON.parse(contentText);

      console.log("✅ Story Created Successfully!");
      console.log(`🎉 Issue Key: ${issueData.key}`);
      console.log(
        `📎 URL: https://martinchrbuur.atlassian.net/browse/${issueData.key}`
      );
      console.log(`📌 ID: ${issueData.id}`);
      console.log("\n✅ Test story has been created in your Jira instance!");

      serverProcess.kill();
      process.exit(0);
    }
  } catch (e) {
    // Ignore parse errors
  }
});

serverProcess.stderr.on("data", (data) => {
  const msg = data.toString();
  if (!msg.includes("Atlassian MCP server running on stdio")) {
    console.error("Error:", msg);
  }
});

// Start by requesting list of projects
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    id: requestId,
    method: "tools/call",
    params: {
      name: "list_projects",
      arguments: { maxResults: 10 },
    },
  };

  console.log("📋 Fetching Jira projects...\n");
  serverProcess.stdin.write(JSON.stringify(request) + "\n");
}, 500);

// Timeout
setTimeout(() => {
  console.error("❌ Timeout - no response received");
  serverProcess.kill();
  process.exit(1);
}, 10000);
