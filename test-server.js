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
let responseBuffer = "";

const rl = readline.createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  console.log("Response:", line);
  responseBuffer += line;

  try {
    const response = JSON.parse(responseBuffer);
    console.log("\n✅ Server responded successfully!");
    console.log("Response ID:", response.id);

    if (response.result && response.result.tools) {
      console.log(`✅ Found ${response.result.tools.length} tools:`);
      response.result.tools.forEach((tool) => {
        console.log(`  - ${tool.name}`);
      });
    }

    console.log("\n🎉 MCP Server is OPERATIONAL and LIVE!");
    serverProcess.kill();
    process.exit(0);
  } catch (e) {
    // Keep waiting for complete JSON
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error("Server Error:", data.toString());
});

serverProcess.on("error", (error) => {
  console.error("Process Error:", error);
  process.exit(1);
});

// Send a test request
setTimeout(() => {
  const testRequest = {
    jsonrpc: "2.0",
    id: requestId,
    method: "tools/list",
    params: {},
  };

  console.log("Sending test request to server...");
  console.log("Request:", JSON.stringify(testRequest));
  serverProcess.stdin.write(JSON.stringify(testRequest) + "\n");
}, 500);

// Timeout if no response
setTimeout(() => {
  console.error("❌ No response from server after 5 seconds");
  serverProcess.kill();
  process.exit(1);
}, 5000);
